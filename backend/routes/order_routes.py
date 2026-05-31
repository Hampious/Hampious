from fastapi import APIRouter, HTTPException, Request
from datetime import datetime

router = APIRouter()

def _get_stores():
    from routes.admin_routes import orders_db, customers_db, _ord_num
    return orders_db, customers_db, _ord_num

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
    orders_db, _, __ = _get_stores()
    if email:
        return [o for o in orders_db if o.get("customer_email") == email]
    return []

@router.get("/")
def get_orders(email: str = None):
    orders_db, _, __ = _get_stores()
    if email:
        return [o for o in orders_db if o.get("customer_email") == email]
    return orders_db

@router.get("/{order_id}")
def get_order(order_id: str):
    orders_db, _, __ = _get_stores()
    o = next((o for o in orders_db if o["id"] == order_id), None)
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    return o

@router.post("/create")
@router.post("/")
def create_order(order_data: dict):
    orders_db, customers_db, _ord_num = _get_stores()
    oid = f"ORD-{_ord_num[0]:03d}"; _ord_num[0] += 1
    new_order = {
        "id": oid, "status": "pending", "payment_status": "pending",
        "tracking_number": None, "courier": None, "notes": "",
        "created_at": datetime.utcnow().isoformat(), "updated_at": datetime.utcnow().isoformat(),
        **order_data,
    }
    orders_db.append(new_order)
    email = order_data.get("customer_email")
    if email:
        existing = next((c for c in customers_db if c["email"] == email), None)
        if existing:
            existing["total_orders"] = existing.get("total_orders", 0) + 1
            existing["total_spent"]  = existing.get("total_spent",  0) + new_order.get("total", 0)
        else:
            customers_db.append({
                "id": len(customers_db) + 1, "email": email,
                "name": order_data.get("customer_name", ""),
                "phone": order_data.get("customer_phone", ""),
                "total_orders": 1, "total_spent": new_order.get("total", 0),
                "created_at": datetime.utcnow().isoformat(),
            })
    return new_order

@router.put("/{order_id}")
def update_order(order_id: str, order_data: dict):
    orders_db, _, __ = _get_stores()
    o = next((o for o in orders_db if o["id"] == order_id), None)
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    o.update(order_data)
    o["updated_at"] = datetime.utcnow().isoformat()
    return o
