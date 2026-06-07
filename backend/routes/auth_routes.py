from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import secrets
import os
import random
import time
from datetime import datetime, timedelta

from database import db_select, db_insert, db_update, db_delete, db_upsert, get_db
from email_utils import send_email, otp_email, reset_password_email, FRONTEND_URL, BREVO_API_KEY

router = APIRouter()

# In-memory token store { token: { email, expires } }
reset_tokens = {}

# In-memory OTP store { contact: { otp, expires } }
_otps: dict = {}


def send_reset_email(to_email: str, reset_link: str):
    """Send password reset email via Brevo."""
    send_email(
        to_email=to_email,
        subject="Reset Your Hampious Password",
        html_body=reset_password_email(reset_link),
    )


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
    email = request.email.strip().lower()
    # Always generate and send — prevents email enumeration and works even when
    # Supabase is unreachable or users_db is empty (e.g. after server restart)
    token = secrets.token_urlsafe(32)
    reset_tokens[token] = {
        "email":   email,
        "expires": datetime.utcnow() + timedelta(hours=1)
    }
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    background_tasks.add_task(send_reset_email, email, reset_link)
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

    sent = send_email(
        to_email=email,
        subject="Your Hampious Login Code",
        html_body=otp_email(otp, name),
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
