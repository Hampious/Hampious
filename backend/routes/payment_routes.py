"""
Payment routes — Razorpay Live Integration
Key ID  : rzp_live_SwaqpwcGpYEzEj
Secret  : MCgJxQcc6Rc8IlXals1M5hKQ
"""
from fastapi import APIRouter, HTTPException, Request
import os
import hmac
import hashlib
import secrets
import razorpay
import requests as http_requests

router = APIRouter()

# ── Razorpay credentials ──────────────────────────────────────────────────────
RAZORPAY_KEY_ID     = os.environ.get("RAZORPAY_KEY_ID",     "rzp_live_SwaqpwcGpYEzEj")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "MCgJxQcc6Rc8IlXals1M5hKQ")

# Initialise Razorpay client once
_rzp = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


# ── Pincode proxy (avoids browser CORS) ──────────────────────────────────────
@router.get("/pincode/{pincode}")
def lookup_pincode(pincode: str):
    if not pincode.isdigit() or len(pincode) != 6:
        raise HTTPException(status_code=400, detail="Invalid pincode")
    try:
        res  = http_requests.get(
            f"https://api.postalpincode.in/pincode/{pincode}", timeout=5
        )
        data = res.json()
        if data and data[0].get("Status") == "Success" and data[0].get("PostOffice"):
            po = data[0]["PostOffice"][0]
            return {
                "success":     True,
                "city":        po.get("District") or po.get("Block") or po.get("Name", ""),
                "state":       po.get("State", ""),
                "country":     "India",
                "post_office": po.get("Name", ""),
            }
        return {"success": False, "message": "Pincode not found"}
    except Exception as e:
        print(f"[pincode] {e}")
        return {"success": False, "message": "Lookup failed"}


# ── Create Razorpay order ─────────────────────────────────────────────────────
@router.post("/payment/create-razorpay-order")
async def create_order(request: Request):
    body = await request.json()

    if isinstance(body, (int, float)):
        amount = float(body)
    elif isinstance(body, dict):
        amount = float(body.get("amount") or body.get("final_amount") or 0)
    else:
        amount = 0.0

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    try:
        order = _rzp.order.create({
            "amount":          int(amount * 100),   # convert ₹ → paise
            "currency":        "INR",
            "payment_capture": 1,                   # auto-capture
        })
        return order                                # { id, amount, currency, status, ... }

    except razorpay.errors.BadRequestError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[razorpay create] {e}")
        raise HTTPException(status_code=500, detail="Could not create Razorpay order")


# ── Verify payment signature ──────────────────────────────────────────────────
@router.post("/payment/verify")
async def verify_payment(request: Request):
    body = await request.json()

    payment_id = body.get("payment_id", "")
    order_id   = body.get("razorpay_order_id", "")
    signature  = body.get("signature", "")

    if not payment_id or not order_id or not signature:
        raise HTTPException(status_code=400, detail="Missing payment fields")

    try:
        # Razorpay HMAC-SHA256 verification
        msg      = f"{order_id}|{payment_id}".encode()
        expected = hmac.new(
            RAZORPAY_KEY_SECRET.encode(), msg, hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Payment signature invalid")

        return {"verified": True}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[razorpay verify] {e}")
        raise HTTPException(status_code=500, detail="Payment verification failed")


# ── Fetch payment details (optional — for receipts) ───────────────────────────
@router.get("/payment/details/{payment_id}")
async def payment_details(payment_id: str):
    try:
        payment = _rzp.payment.fetch(payment_id)
        return {
            "id":       payment["id"],
            "amount":   payment["amount"] / 100,
            "currency": payment["currency"],
            "status":   payment["status"],
            "method":   payment.get("method"),
            "email":    payment.get("email"),
            "contact":  payment.get("contact"),
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Refund payment ────────────────────────────────────────────────────────────
@router.post("/payment/refund/{payment_id}")
async def refund_payment(payment_id: str, request: Request):
    body   = await request.json()
    amount = body.get("amount")          # optional — None = full refund

    try:
        params = {"speed": "normal"}
        if amount:
            params["amount"] = int(float(amount) * 100)

        refund = _rzp.payment.refund(payment_id, params)
        return {
            "refund_id": refund["id"],
            "amount":    refund["amount"] / 100,
            "status":    refund["status"],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
