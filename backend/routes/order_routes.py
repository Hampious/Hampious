from fastapi import APIRouter, HTTPException, Request
from datetime import datetime
import threading

from database import db_select, db_insert, db_update, db_delete, db_upsert, get_db
from email_utils import send_email, order_confirmation_email

router = APIRouter()


def _email_from_request(request: Request) -> str:
    """Extract user email from Bearer token (format: token_{email})."""
    auth = request.headers.get("authorization", "")
    token = auth.replace("Bearer ", "").replace("bearer ", "").strip()
    if token.startswith("token_"):
        return token[len("token_"):]
    return ""


@router.get("/my")
def get_my_orders(request: Request):
    """Return orders for the currently logged-in user."""
    email = _email_from_request(request)
    if not email:
        return []
    try:
        return db_select("orders", {"customer_email": email})
    except Exception as e:
        print(f"[get_my_orders] Supabase error: {e}")
        return []


@router.get("/")
def get_orders(email: str = None):
    try:
        filters = {"customer_email": email} if email else None
        return db_select("orders", filters, order="created_at")
    except Exception as e:
        print(f"[get_orders] Supabase error: {e}")
        return []


@router.get("/{order_id}")
def get_order(order_id: str):
    try:
        rows = db_select("orders", {"id": order_id})
        if not rows:
            raise HTTPException(status_code=404, detail="Order not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_order] Supabase error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch order")


@router.post("/create")
@router.post("/")
def create_order(order_data: dict):
    now = datetime.utcnow().isoformat()
    # Normalise total fields — frontend may send 'total', Supabase expects 'total_amount'/'final_amount'
    total       = float(order_data.get("total") or order_data.get("total_amount") or 0)
    final       = float(order_data.get("final_amount") or order_data.get("total") or 0)
    discount    = float(order_data.get("discount_amount") or 0)

    new_order = {
        "status":          "pending",
        "payment_status":  "pending",
        "tracking_number": None,
        "courier":         None,
        "notes":           "",
        "created_at":      now,
        "updated_at":      now,
        **order_data,
        # Ensure correct column names for Supabase
        "total_amount":    total,
        "final_amount":    final,
        "discount_amount": discount,
    }
    # Remove 'total' key if present (not a Supabase column)
    new_order.pop("total", None)

    try:
        result = db_insert("orders", new_order)
        saved_order = result[0] if result else new_order
    except Exception as e:
        print(f"[create_order] Supabase insert error: {e}")
        saved_order = new_order

    # Upsert customer record
    email = order_data.get("customer_email")
    if email:
        try:
            existing = db_select("customers", {"email": email})
            if existing:
                c = existing[0]
                db_update("customers", "email", email, {
                    "total_orders": c.get("total_orders", 0) + 1,
                    "total_spent":  c.get("total_spent",  0) + new_order.get("final_amount", 0),
                })
            else:
                db_insert("customers", {
                    "email":        email,
                    "name":         order_data.get("customer_name", ""),
                    "phone":        order_data.get("customer_phone", ""),
                    "total_orders": 1,
                    "total_spent":  new_order.get("final_amount", 0),
                    "created_at":   now,
                })
        except Exception as e:
            print(f"[create_order] customer upsert error: {e}")

    # Send order confirmation email in background
    customer_email = order_data.get("customer_email")
    if customer_email:
        def _send_confirmation():
            try:
                html = order_confirmation_email(saved_order)
                send_email(customer_email, f"Order Confirmed #{str(saved_order.get('id','')).upper()} — Hampious 🎁", html)
            except Exception as e:
                print(f"[create_order] confirmation email error: {e}")
        threading.Thread(target=_send_confirmation, daemon=True).start()

    return saved_order


@router.put("/{order_id}")
def update_order(order_id: str, order_data: dict):
    try:
        rows = db_select("orders", {"id": order_id})
        if not rows:
            raise HTTPException(status_code=404, detail="Order not found")
        updates = {**order_data, "updated_at": datetime.utcnow().isoformat()}
        result = db_update("orders", "id", order_id, updates)
        return result[0] if result else {**rows[0], **updates}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_order] Supabase error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update order")
