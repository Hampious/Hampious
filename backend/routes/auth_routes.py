from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import smtplib
import secrets
import os
import random
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta

from database import db_select, db_insert, db_update, db_delete, db_upsert, get_db

router = APIRouter()

# In-memory token store { token: { email, expires } }
reset_tokens = {}

# In-memory OTP store { contact: { otp, expires } }
_otps: dict = {}

# ── Brevo config ──────────────────────────────────────────────────────────────
BREVO_API_KEY     = os.environ.get("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.environ.get("BREVO_SENDER_EMAIL", "team.hampious@gmail.com")
BREVO_SENDER_NAME  = os.environ.get("BREVO_SENDER_NAME", "Hampious")


def _send_brevo_email(to_email: str, subject: str, html_content: str):
    """Send email via Brevo transactional API."""
    try:
        import sib_api_v3_sdk
        config = sib_api_v3_sdk.Configuration()
        config.api_key["api-key"] = BREVO_API_KEY
        api = sib_api_v3_sdk.TransactionalEmailsApi(
              sib_api_v3_sdk.ApiClient(config))
        email_obj = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": to_email}],
            sender={"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
            subject=subject,
            html_content=html_content,
        )
        api.send_transac_email(email_obj)
        return True
    except Exception as e:
        print(f"[brevo] Email send error: {e}")
        return False


def _otp_email_html(otp: str, name: str = "there") -> str:
    return f"""
    <div style="font-family:'Georgia',serif;max-width:500px;margin:0 auto;
                background:#FFF5F8;border-radius:16px;overflow:hidden;">
      <div style="background:#1A0F15;padding:2rem;text-align:center;">
        <h1 style="color:#D4789A;font-size:1.8rem;margin:0;letter-spacing:0.12em;">
          🎁 HAMPIOUS
        </h1>
        <p style="color:rgba(255,245,248,0.5);font-size:0.75rem;
                  letter-spacing:0.2em;margin:0.3rem 0 0;">
          PREMIUM GIFT HAMPERS
        </p>
      </div>
      <div style="padding:2.5rem 2rem;text-align:center;">
        <h2 style="color:#3D1A2A;font-size:1.5rem;margin:0 0 0.5rem;">
          Hi {name}! 👋
        </h2>
        <p style="color:rgba(30,26,23,0.6);margin:0 0 1.5rem;">
          Your one-time login code is:
        </p>
        <div style="background:#fff;border:2px dashed #D4789A;border-radius:14px;
                    padding:1.5rem;margin:0 auto 1.5rem;display:inline-block;
                    min-width:200px;">
          <span style="font-size:2.5rem;font-weight:bold;color:#B84E78;
                       letter-spacing:12px;font-family:monospace;">
            {otp}
          </span>
        </div>
        <p style="color:rgba(30,26,23,0.45);font-size:0.85rem;margin:0;">
          ⏱ Valid for <strong>10 minutes</strong>. Do not share with anyone.
        </p>
      </div>
      <div style="background:#FCEAF1;padding:1rem 2rem;text-align:center;
                  border-top:1px solid rgba(212,120,154,0.15);">
        <p style="color:rgba(30,26,23,0.35);font-size:0.72rem;margin:0;">
          If you didn't request this, ignore this email.
          © 2024 Hampious
        </p>
      </div>
    </div>
    """

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

# In-memory fallback user store
users_db = {
    "test@example.com": {
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User"
    }
}


@router.post("/signup")
def signup(request: SignupRequest):
    # Check local store first
    if request.email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")

    # Check Supabase for duplicate
    try:
        existing = db_select("customers", {"email": request.email})
        if existing:
            raise HTTPException(status_code=400, detail="User already exists")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[signup] Supabase check error: {e}")

    full_name = request.name or f"{request.first_name or ''} {request.last_name or ''}".strip() or "New User"

    users_db[request.email] = {
        "email":    request.email,
        "password": request.password,
        "name":     full_name,
        "phone":    request.phone or ""
    }

    # Persist to Supabase
    try:
        db_insert("customers", {
            "email":        request.email,
            "name":         full_name,
            "phone":        request.phone or "",
            "password":     request.password,
            "total_orders": 0,
            "total_spent":  0,
            "created_at":   datetime.utcnow().isoformat(),
        })
    except Exception as e:
        print(f"[signup] Supabase insert error: {e}")

    return {
        "message": "User created successfully",
        "user": {
            "email": request.email,
            "name":  full_name,
            "phone": request.phone
        },
        "token": f"token_{request.email}"
    }


@router.post("/login")
@router.post("/signin")
def login(request: LoginRequest):
    # Try local store first
    user = users_db.get(request.email)

    if not user:
        # Fall back to Supabase
        try:
            rows = db_select("customers", {"email": request.email})
            if rows:
                row = rows[0]
                # Load into local store for this session
                users_db[request.email] = {
                    "email":    row.get("email", request.email),
                    "password": row.get("password", ""),
                    "name":     row.get("name", ""),
                    "phone":    row.get("phone", ""),
                }
                user = users_db[request.email]
        except Exception as e:
            print(f"[login] Supabase lookup error: {e}")

    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "user": {
            "email": user["email"],
            "name":  user["name"]
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
    if not user:
        try:
            rows = db_select("customers", {"email": request.email})
            if rows:
                user = rows[0]
        except Exception as e:
            print(f"[forgot_password] Supabase error: {e}")

    if user:
        token = secrets.token_urlsafe(32)
        reset_tokens[token] = {
            "email":   request.email,
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

    # Update password in Supabase
    try:
        db_update("customers", "email", email, {"password": request.new_password})
    except Exception as e:
        print(f"[reset_password] Supabase update error: {e}")

    del reset_tokens[request.token]
    return {"message": "Password reset successfully"}


@router.post("/logout")
def logout():
    return {"message": "Logout successful"}


# ═══════════════════════════════════════════════════════════════════════════════
# OTP AUTHENTICATION (via Brevo Email)
# ═══════════════════════════════════════════════════════════════════════════════

class SendOtpRequest(BaseModel):
    email: str
    name: Optional[str] = "there"

class VerifyOtpRequest(BaseModel):
    email: str
    otp:   str

@router.post("/send-otp")
def send_otp(request: SendOtpRequest):
    email = request.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email required")

    if not BREVO_API_KEY:
        raise HTTPException(status_code=500, detail="Email service not configured")

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    _otps[email] = {"otp": otp, "expires": time.time() + 600}  # 10 min

    # Get user name from Supabase if exists
    name = request.name or "there"
    try:
        rows = db_select("customers", {"email": email})
        if rows and rows[0].get("name"):
            name = rows[0]["name"].split()[0]
    except: pass

    sent = _send_brevo_email(
        to_email=email,
        subject="Your Hampious Login OTP",
        html_content=_otp_email_html(otp, name),
    )
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

    return {"message": "OTP sent to your email", "email": email}


@router.post("/verify-otp")
def verify_otp(request: VerifyOtpRequest):
    email = request.email.strip().lower()
    entry = _otps.get(email)

    if not entry:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")
    if time.time() > entry["expires"]:
        del _otps[email]
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
    if entry["otp"] != request.otp.strip():
        raise HTTPException(status_code=400, detail="Invalid OTP. Please try again.")

    # OTP valid — delete it
    del _otps[email]

    # Get or create user in Supabase
    name = email.split("@")[0].title()
    try:
        rows = db_select("customers", {"email": email})
        if rows:
            name = rows[0].get("name", name)
        else:
            db_insert("customers", {
                "email":        email,
                "name":         name,
                "total_orders": 0,
                "total_spent":  0,
                "created_at":   datetime.utcnow().isoformat(),
            })
    except Exception as e:
        print(f"[verify_otp] Supabase error: {e}")

    # Cache in local session store
    if email not in users_db:
        users_db[email] = {"email": email, "name": name, "password": "", "phone": ""}

    return {
        "message": "Login successful",
        "token":   f"token_{email}",
        "user":    {"email": email, "name": name},
    }


@router.get("/profile")
def get_profile(email: str):
    user = users_db.get(email)

    if not user:
        try:
            rows = db_select("customers", {"email": email})
            if rows:
                user = rows[0]
        except Exception as e:
            print(f"[get_profile] Supabase error: {e}")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "email": user.get("email", email),
        "name":  user.get("name", "")
    }
