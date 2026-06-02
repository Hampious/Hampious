"""
Hampious Admin Routes — no external auth library required (stdlib only).
Token = simple random string stored in memory. Works with ?token= or Authorization header.
Data persisted in Supabase; falls back to empty lists if Supabase is not configured.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import secrets
import os

from database import db_select, db_insert, db_update, db_delete, db_upsert, get_db

router = APIRouter()

# ─── Config ──────────────────────────────────────────────────────────────────
ADMIN_EMAIL    = os.environ.get("ADMIN_EMAIL",    "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

EMAIL_HOST         = os.environ.get("EMAIL_HOST",  "smtp.gmail.com")
EMAIL_PORT         = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USERNAME     = os.environ.get("EMAIL_USERNAME", "")
EMAIL_PASSWORD_ENV = os.environ.get("EMAIL_PASSWORD", "")
EMAIL_FROM         = os.environ.get("EMAIL_FROM",  "Hampious <no-reply@hampious.com>")
FRONTEND_URL       = os.environ.get("FRONTEND_URL","http://localhost:3000")

# ─── Active session tokens (in-memory — intentional) ─────────────────────────
_sessions = set()

# ─── Auth helpers ─────────────────────────────────────────────────────────────
def _get_token(request: Request) -> str:
    t = request.query_params.get("token", "")
    if not t:
        auth = request.headers.get("authorization", "")
        t = auth.replace("Bearer ", "").replace("bearer ", "").strip()
    return t

def _verify(request: Request):
    t = _get_token(request)
    if not t or t not in _sessions:
        raise HTTPException(status_code=401, detail="Unauthorized")

# ─── Email ────────────────────────────────────────────────────────────────────
STATUS_LABELS = {
    "pending":    ("Pending",    "#F59E0B"),
    "processing": ("Processing", "#3B82F6"),
    "shipped":    ("Shipped",    "#8B5CF6"),
    "delivered":  ("Delivered",  "#10B981"),
    "cancelled":  ("Cancelled",  "#EF4444"),
}

def _send_order_email(order: dict):
    try:
        label, color = STATUS_LABELS.get(order["status"], (order["status"].title(), "#D4789A"))
        tracking = ""
        if order.get("tracking_number"):
            tracking = f'<p>Tracking: <strong>{order["tracking_number"]}</strong>' + (f' via {order["courier"]}' if order.get("courier") else "") + "</p>"
        items_html = "".join(
            f'<tr><td>{i["name"]}</td><td style="text-align:right">x{i["qty"]} - Rs.{i["price"]}</td></tr>'
            for i in order.get("items", [])
        )
        html = f"""<div style="max-width:520px;margin:0 auto;background:#FFF5F8;border-radius:16px;overflow:hidden;">
          <div style="background:#1A0F15;padding:2rem;text-align:center;">
            <h1 style="color:#D4789A;margin:0;">HAMPIOUS</h1></div>
          <div style="padding:2rem;">
            <span style="background:{color};color:#fff;border-radius:50px;padding:4px 16px;font-size:13px;">{label}</span>
            <h2 style="color:#3D1A2A;">Hi {order.get('customer_name','there')}!</h2>
            <p>Your order <strong>#{order["id"]}</strong> is now <strong>{label}</strong>.</p>
            {tracking}
            <table style="width:100%;border-collapse:collapse;">{items_html}</table>
            <p style="color:#B84E78;font-weight:700;">Total: Rs.{order.get('total','')}</p>
            <a href="{FRONTEND_URL}/my-orders" style="background:#D4789A;color:#fff;text-decoration:none;padding:12px 32px;border-radius:50px;display:inline-block;font-weight:700;">View Order</a>
          </div></div>"""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Hampious Order #{order['id']} is {label}"
        msg["From"] = EMAIL_FROM
        msg["To"] = order["customer_email"]
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as s:
            s.starttls()
            s.login(EMAIL_USERNAME, EMAIL_PASSWORD_ENV)
            s.sendmail(EMAIL_USERNAME, order["customer_email"], msg.as_string())
    except Exception as e:
        print(f"[email error] {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# AUTH
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/login")
async def admin_login(request: Request):
    body = await request.json()
    if body.get("email") != ADMIN_EMAIL or body.get("password") != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    token = secrets.token_urlsafe(32)
    _sessions.add(token)
    return {"access_token": token, "token_type": "bearer", "email": ADMIN_EMAIL}

@router.get("/verify")
async def admin_verify(request: Request):
    _verify(request)
    return {"ok": True}

# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard")
async def dashboard(request: Request):
    _verify(request)
    try:
        products  = db_select("products")
        orders    = db_select("orders")
        customers = db_select("customers")
    except Exception as e:
        print(f"[dashboard] Supabase error: {e}")
        products = orders = customers = []

    revenue = sum(o.get("total", 0) for o in orders if o.get("payment_status") == "paid")
    recent  = sorted(orders, key=lambda o: o.get("created_at", ""), reverse=True)[:5]

    return {
        "total_products":        len(products),
        "total_orders":          len(orders),
        "total_customers":       len(customers),
        "total_revenue":         revenue,
        "pending_orders":        sum(1 for o in orders if o.get("status") == "pending"),
        "processing_orders":     sum(1 for o in orders if o.get("status") == "processing"),
        "shipped_orders":        sum(1 for o in orders if o.get("status") == "shipped"),
        "delivered_orders":      sum(1 for o in orders if o.get("status") == "delivered"),
        "low_stock_products":    sum(1 for p in products if 0 < p.get("stock", 0) <= 3),
        "out_of_stock_products": sum(1 for p in products if p.get("stock", 0) == 0),
        "recent_orders":         recent,
    }

# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/products")
async def list_products(request: Request):
    _verify(request)
    try:
        return db_select("products")
    except Exception as e:
        print(f"[products] Supabase error: {e}")
        return []

@router.post("/products")
async def add_product(request: Request):
    _verify(request)
    body = await request.json()
    p = {
        "name":           body.get("name", ""),
        "price":          float(body.get("price") or 0),
        "original_price": float(body["original_price"]) if body.get("original_price") else None,
        "description":    body.get("description", ""),
        "category":       body.get("category", ""),
        "images":         body.get("images", []),
        "stock":          int(body.get("stock") or 0),
        "tags":           body.get("tags", []),
        "is_featured":    bool(body.get("is_featured", False)),
        "created_at":     datetime.utcnow().isoformat(),
    }
    try:
        result = db_insert("products", p)
        return result[0] if result else p
    except Exception as e:
        print(f"[add_product] Supabase error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create product")

@router.put("/products/{product_id}")
async def update_product(product_id: int, request: Request):
    _verify(request)
    body = await request.json()
    try:
        existing = db_select("products", {"id": product_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Product not found")
        result = db_update("products", "id", product_id, body)
        return result[0] if result else {**existing[0], **body}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_product] Supabase error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update product")

@router.delete("/products/{product_id}")
async def delete_product(product_id: int, request: Request):
    _verify(request)
    try:
        db_delete("products", "id", product_id)
    except Exception as e:
        print(f"[delete_product] Supabase error: {e}")
    return {"message": "Deleted"}

# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORIES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/categories")
async def list_categories(request: Request):
    _verify(request)
    try:
        return db_select("categories")
    except Exception as e:
        print(f"[categories] Supabase error: {e}")
        return []

@router.post("/categories")
async def add_category(request: Request):
    _verify(request)
    body = await request.json()
    cat = {
        "name":        body.get("name", ""),
        "slug":        body.get("slug", ""),
        "icon":        body.get("icon", "gift"),
        "description": body.get("description", ""),
    }
    try:
        result = db_insert("categories", cat)
        return result[0] if result else cat
    except Exception as e:
        print(f"[add_category] Supabase error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create category")

@router.put("/categories/{cat_id}")
async def update_category(cat_id: int, request: Request):
    _verify(request)
    body = await request.json()
    try:
        existing = db_select("categories", {"id": cat_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Not found")
        result = db_update("categories", "id", cat_id, body)
        return result[0] if result else {**existing[0], **body}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_category] Supabase error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update category")

@router.delete("/categories/{cat_id}")
async def delete_category(cat_id: int, request: Request):
    _verify(request)
    try:
        db_delete("categories", "id", cat_id)
    except Exception as e:
        print(f"[delete_category] Supabase error: {e}")
    return {"message": "Deleted"}

# ═══════════════════════════════════════════════════════════════════════════════
# ORDERS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/orders")
async def list_orders(request: Request):
    _verify(request)
    status_f = request.query_params.get("status")
    try:
        filters = {"status": status_f} if status_f else None
        orders = db_select("orders", filters, order="created_at")
        return orders
    except Exception as e:
        print(f"[list_orders] Supabase error: {e}")
        return []

@router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    _verify(request)
    try:
        rows = db_select("orders", {"id": order_id})
        if not rows:
            raise HTTPException(status_code=404, detail="Not found")
        return rows[0]
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_order] Supabase error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch order")

@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, request: Request, background_tasks: BackgroundTasks):
    _verify(request)
    body = await request.json()
    try:
        rows = db_select("orders", {"id": order_id})
        if not rows:
            raise HTTPException(status_code=404, detail="Not found")
        o = rows[0]
        updates = {"updated_at": datetime.utcnow().isoformat()}
        if "status"         in body: updates["status"]          = body["status"]
        if "tracking_number" in body: updates["tracking_number"] = body["tracking_number"]
        if "courier"         in body: updates["courier"]         = body["courier"]
        if "notes"           in body: updates["notes"]           = body["notes"]
        result = db_update("orders", "id", order_id, updates)
        updated = result[0] if result else {**o, **updates}
        if EMAIL_USERNAME:
            background_tasks.add_task(_send_order_email, dict(updated))
        return updated
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_order_status] Supabase error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update order")

@router.delete("/orders/{order_id}")
async def delete_order(order_id: str, request: Request):
    _verify(request)
    try:
        db_delete("orders", "id", order_id)
    except Exception as e:
        print(f"[delete_order] Supabase error: {e}")
    return {"message": "Deleted"}

# ═══════════════════════════════════════════════════════════════════════════════
# CUSTOMERS / USERS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/customers")
@router.get("/users")
async def list_customers(request: Request):
    _verify(request)
    try:
        return db_select("customers")
    except Exception as e:
        print(f"[customers] Supabase error: {e}")
        return []

@router.delete("/customers/{cid}")
async def delete_customer(cid: int, request: Request):
    _verify(request)
    try:
        db_delete("customers", "id", cid)
    except Exception as e:
        print(f"[delete_customer] Supabase error: {e}")
    return {"message": "Deleted"}
