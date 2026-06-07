from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import db_select, db_insert, db_update, db_delete
import secrets
import os

router = APIRouter()

ADMIN_EMAIL    = os.environ.get("ADMIN_EMAIL", "team.hampious@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Hampious@123")

def _verify(request: Request):
    token = (
        request.headers.get("Authorization", "").replace("Bearer ", "").strip()
        or request.query_params.get("token", "")
    )
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

# ── Models ────────────────────────────────────────────────────────────────────

class CouponCreate(BaseModel):
    code: str
    discount_percent: float
    min_order_amount: Optional[float] = 0
    max_uses: Optional[int] = None
    expires_at: Optional[str] = None
    description: Optional[str] = ""

# ── Admin CRUD ────────────────────────────────────────────────────────────────

@router.get("/admin/coupons")
async def list_coupons(request: Request):
    _verify(request)
    try:
        rows = db_select("coupons")
        return rows or []
    except Exception as e:
        print(f"[coupons] list error: {e}")
        return []

@router.post("/admin/coupons")
async def create_coupon(request: Request):
    _verify(request)
    body = await request.json()
    code = body.get("code", "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Coupon code is required")

    # Check duplicate
    try:
        existing = db_select("coupons", {"code": code})
        if existing:
            raise HTTPException(status_code=400, detail="Coupon code already exists")
    except HTTPException:
        raise
    except Exception:
        pass

    coupon = {
        "code":             code,
        "discount_percent": float(body.get("discount_percent", 0)),
        "min_order_amount": float(body.get("min_order_amount", 0)),
        "max_uses":         body.get("max_uses") or None,
        "times_used":       0,
        "is_active":        True,
        "description":      body.get("description", ""),
        "expires_at":       body.get("expires_at") or None,
        "created_at":       datetime.utcnow().isoformat(),
    }
    try:
        result = db_insert("coupons", coupon)
        return result[0] if result else coupon
    except Exception as e:
        print(f"[coupons] create error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create coupon")

@router.put("/admin/coupons/{coupon_id}")
async def update_coupon(coupon_id: int, request: Request):
    _verify(request)
    body = await request.json()
    try:
        result = db_update("coupons", "id", coupon_id, body)
        return result[0] if result else body
    except Exception as e:
        print(f"[coupons] update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update coupon")

@router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: int, request: Request):
    _verify(request)
    try:
        db_delete("coupons", "id", coupon_id)
        return {"message": "Deleted"}
    except Exception as e:
        print(f"[coupons] delete error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete coupon")

# ── Public: validate coupon ───────────────────────────────────────────────────

@router.get("/coupons/validate/{code}")
async def validate_coupon(code: str, amount: float = 0):
    try:
        rows = db_select("coupons", {"code": code.strip().upper()})
    except Exception as e:
        print(f"[coupons] validate error: {e}")
        raise HTTPException(status_code=500, detail="Could not validate coupon")

    if not rows:
        raise HTTPException(status_code=404, detail="Invalid coupon code")

    c = rows[0]

    if not c.get("is_active", True):
        raise HTTPException(status_code=400, detail="This coupon is no longer active")

    # Check expiry
    if c.get("expires_at"):
        try:
            exp = datetime.fromisoformat(str(c["expires_at"]).replace("Z", ""))
            if exp < datetime.utcnow():
                raise HTTPException(status_code=400, detail="This coupon has expired")
        except HTTPException:
            raise
        except Exception:
            pass

    # Check usage limit
    if c.get("max_uses") and int(c.get("times_used", 0)) >= int(c["max_uses"]):
        raise HTTPException(status_code=400, detail="This coupon has reached its usage limit")

    # Check minimum order
    min_amt = float(c.get("min_order_amount", 0))
    if amount < min_amt:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order amount of ₹{min_amt:.0f} required for this coupon"
        )

    discount_pct = float(c.get("discount_percent", 0))
    discount_amt = round(amount * discount_pct / 100, 2)

    return {
        "valid":            True,
        "coupon":           c,
        "discount_percent": discount_pct,
        "discount":         discount_amt,
        "message":          f"{discount_pct:.0f}% discount applied!",
    }

@router.post("/coupons/use/{code}")
async def mark_coupon_used(code: str):
    """Increment times_used after a successful order."""
    try:
        rows = db_select("coupons", {"code": code.strip().upper()})
        if rows:
            c = rows[0]
            db_update("coupons", "id", c["id"], {"times_used": int(c.get("times_used", 0)) + 1})
    except Exception as e:
        print(f"[coupons] mark-used error: {e}")
    return {"ok": True}
