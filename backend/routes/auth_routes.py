from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import smtplib
import secrets
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta

router = APIRouter()

# In-memory token store { token: { email, expires } }
reset_tokens = {}

EMAIL_HOST     = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT     = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USERNAME = os.environ.get('EMAIL_USERNAME', '')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', '')
EMAIL_FROM     = os.environ.get('EMAIL_FROM', 'Hampious <no-reply@hampious.com>')
FRONTEND_URL   = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

def send_reset_email(to_email: str, reset_link: str):
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Reset Your Hampious Password'
        msg['From']    = EMAIL_FROM
        msg['To']      = to_email

        html = f"""
        <div style="font-family:'Georgia',serif;max-width:520px;margin:0 auto;background:#FFF5F8;border-radius:16px;overflow:hidden;">
          <div style="background:#1A0F15;padding:2rem;text-align:center;">
            <h1 style="color:#D4789A;font-size:1.8rem;margin:0;letter-spacing:0.1em;">HAMPIOUS</h1>
            <p style="color:rgba(255,245,248,0.5);font-size:0.75rem;letter-spacing:0.2em;margin:0.3rem 0 0;">PREMIUM GIFT HAMPERS</p>
          </div>
          <div style="padding:2.5rem 2rem;text-align:center;">
            <div style="width:64px;height:64px;border-radius:50%;border:2px solid #D4789A;background:rgba(212,120,154,0.1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:1.5rem;">
              🔑
            </div>
            <h2 style="color:#3D1A2A;font-size:1.6rem;margin:0 0 0.75rem;">Reset Your Password</h2>
            <p style="color:rgba(30,26,23,0.55);font-size:0.9rem;line-height:1.8;margin:0 0 2rem;">
              We received a request to reset your password.<br/>Click the button below to set a new one.
            </p>
            <a href="{reset_link}" style="display:inline-block;background:#D4789A;color:#FFFFFF;text-decoration:none;padding:0.85rem 2.5rem;border-radius:50px;font-size:0.8rem;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;">
              Reset Password
            </a>
            <p style="color:rgba(30,26,23,0.35);font-size:0.75rem;margin:2rem 0 0;line-height:1.7;">
              This link expires in <strong>1 hour</strong>.<br/>
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          <div style="background:#FCEAF1;padding:1rem 2rem;text-align:center;border-top:1px solid rgba(212,120,154,0.15);">
            <p style="color:rgba(30,26,23,0.35);font-size:0.72rem;margin:0;">© 2024 Hampious. All rights reserved.</p>
          </div>
        </div>
        """
        msg.attach(MIMEText(html, 'html'))

        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
            server.sendmail(EMAIL_USERNAME, to_email, msg.as_string())
    except Exception as e:
        print(f"Email send error: {e}")

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    name: Optional[str] = None

# Mock user database for local development
users_db = {
    "test@example.com": {
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User"
    }
}

@router.post("/signup")
def signup(request: SignupRequest):
    if request.email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")

    full_name = request.name or f"{request.first_name or ''} {request.last_name or ''}".strip() or "New User"

    users_db[request.email] = {
        "email": request.email,
        "password": request.password,
        "name": full_name,
        "phone": request.phone or ""
    }

    return {
        "message": "User created successfully",
        "user": {
            "email": request.email,
            "name": full_name,
            "phone": request.phone
        },
        "token": f"token_{request.email}"
    }

@router.post("/login")
@router.post("/signin")
def login(request: LoginRequest):
    user = users_db.get(request.email)

    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "user": {
            "email": user["email"],
            "name": user["name"]
        },
        "token": f"token_{user['email']}"
    }

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    # Always return success to prevent email enumeration
    user = users_db.get(request.email)
    if user:
        token = secrets.token_urlsafe(32)
        reset_tokens[token] = {
            "email": request.email,
            "expires": datetime.utcnow() + timedelta(hours=1)
        }
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        background_tasks.add_task(send_reset_email, request.email, reset_link)

    return {"message": "If this email is registered, a reset link has been sent."}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest):
    entry = reset_tokens.get(request.token)
    if not entry:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if datetime.utcnow() > entry["expires"]:
        del reset_tokens[request.token]
        raise HTTPException(status_code=400, detail="Reset token has expired")

    email = entry["email"]
    if email in users_db:
        users_db[email]["password"] = request.new_password

    del reset_tokens[request.token]
    return {"message": "Password reset successfully"}

@router.post("/logout")
def logout():
    return {"message": "Logout successful"}

@router.get("/profile")
def get_profile(email: str):
    user = users_db.get(email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "email": user["email"],
        "name": user["name"]
    }
