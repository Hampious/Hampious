"""
Hampious Admin Routes — no external auth library required (stdlib only).
Token = simple random string stored in memory. Works with ?token= or Authorization header.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import secrets
import os

router = APIRouter()

# ─── Config ──────────────────────────────────────────────────────────────────
ADMIN_EMAIL    = os.environ.get("ADMIN_EMAIL",    "team.hampious@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Hampious@123")

EMAIL_HOST     = os.environ.get("EMAIL_HOST",  "smtp.gmail.com")
EMAIL_PORT     = int(os.environ.get("EMAIL_PORT", 587))
EMAIL_USERNAME = os.environ.get("EMAIL_USERNAME", "")
EMAIL_PASSWORD_ENV = os.environ.get("EMAIL_PASSWORD", "")
EMAIL_FROM     = os.environ.get("EMAIL_FROM",  "Hampious <no-reply@hampious.com>")
FRONTEND_URL   = os.environ.get("FRONTEND_URL","http://localhost:3000")

# ─── Active session tokens (in-memory) ───────────────────────────────────────
_sessions = set()

# ─── Data stores ─────────────────────────────────────────────────────────────
categories_db = [
    {"id": 1, "name": "Birthday",    "slug": "birthday",  "icon": "Birthday",  "description": "Birthday hampers"},
    {"id": 2, "name": "Love",        "slug": "love",      "icon": "Love",      "description": "Love & romance"},
    {"id": 3, "name": "Period Care", "slug": "period",    "icon": "Period",    "description": "Period care & wellness"},
    {"id": 4, "name": "Sorry",       "slug": "sorry",     "icon": "Sorry",     "description": "Apology hampers"},
    {"id": 5, "name": "Festive",     "slug": "festive",   "icon": "Festive",   "description": "Festive & celebration"},
    {"id": 6, "name": "Self Care",   "slug": "self-care", "icon": "SelfCare",  "description": "Self care"},
]

products_db = [
    {"id": 1, "name": "Pink Birthday Bliss Hamper", "price": 1499, "original_price": 1999,
     "description": "Luxurious birthday hamper with chocolates, candles, skincare.",
     "category": "birthday", "images": ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600"],
     "stock": 15, "tags": ["birthday","luxury"], "is_featured": True, "created_at": datetime.utcnow().isoformat()},
    {"id": 2, "name": "Love & Roses Hamper", "price": 1999, "original_price": 2499,
     "description": "Romantic hamper with rose bath products and artisan chocolates.",
     "category": "love", "images": ["https://images.unsplash.com/photo-1512909006721-3d6018887383?w=600"],
     "stock": 8, "tags": ["love","roses"], "is_featured": True, "created_at": datetime.utcnow().isoformat()},
    {"id": 3, "name": "Period Care Comfort Kit", "price": 899, "original_price": 1199,
     "description": "Herbal teas, heating pad, chocolates, face mask and socks.",
     "category": "period", "images": ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600"],
     "stock": 22, "tags": ["period","wellness"], "is_featured": True, "created_at": datetime.utcnow().isoformat()},
    {"id": 4, "name": "Forgive Me Hamper", "price": 1299, "original_price": 1599,
     "description": "Say sorry with candles, chocolates and a handwritten card.",
     "category": "sorry", "images": ["https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600"],
     "stock": 2, "tags": ["sorry","apology"], "is_featured": False, "created_at": datetime.utcnow().isoformat()},
]

orders_db = [
    {"id": "ORD-001", "customer_name": "Test User", "customer_email": "test@example.com",
     "customer_phone": "+91 9876543210",
     "items": [{"product_id": 1, "name": "Pink Birthday Bliss Hamper", "qty": 1, "price": 1499}],
     "subtotal": 1499, "shipping": 99, "total": 1598,
     "status": "processing", "payment_status": "paid",
     "shipping_address": {"line1": "123 MG Road", "city": "Bangalore", "state": "Karnataka", "pincode": "560001"},
     "tracking_number": None, "courier": None, "notes": "",
     "created_at": datetime.utcnow().isoformat(), "updated_at": datetime.utcnow().isoformat()},
]

customers_db = [
    {"id": 1, "email": "test@example.com", "name": "Test User", "phone": "",
     "total_orders": 1, "total_spent": 1598, "created_at": datetime.utcnow().isoformat()},
]

_cat_id  = [7]
_prod_id = [5]
_ord_num = [2]

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
    revenue = sum(o["total"] for o in orders_db if o.get("payment_status") == "paid")
    return {
        "total_products":       len(products_db),
        "total_orders":         len(orders_db),
        "total_customers":      len(customers_db),
        "total_revenue":        revenue,
        "pending_orders":       sum(1 for o in orders_db if o["status"] == "pending"),
        "processing_orders":    sum(1 for o in orders_db if o["status"] == "processing"),
        "shipped_orders":       sum(1 for o in orders_db if o["status"] == "shipped"),
        "delivered_orders":     sum(1 for o in orders_db if o["status"] == "delivered"),
        "low_stock_products":   sum(1 for p in products_db if 0 < p["stock"] <= 3),
        "out_of_stock_products":sum(1 for p in products_db if p["stock"] == 0),
        "recent_orders":        sorted(orders_db, key=lambda o: o["created_at"], reverse=True)[:5],
    }

# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/products")
async def list_products(request: Request):
    _verify(request)
    return products_db

@router.post("/products")
async def add_product(request: Request):
    _verify(request)
    body = await request.json()
    pid = _prod_id[0]; _prod_id[0] += 1
    p = {
        "id": pid,
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
    products_db.append(p)
    return p

@router.put("/products/{product_id}")
async def update_product(product_id: int, request: Request):
    _verify(request)
    body = await request.json()
    product = next((p for p in products_db if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in body.items():
        product[k] = v
    return product

@router.delete("/products/{product_id}")
async def delete_product(product_id: int, request: Request):
    _verify(request)
    products_db[:] = [p for p in products_db if p["id"] != product_id]
    return {"message": "Deleted"}

# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORIES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/categories")
async def list_categories(request: Request):
    _verify(request)
    return categories_db

@router.post("/categories")
async def add_category(request: Request):
    _verify(request)
    body = await request.json()
    cid = _cat_id[0]; _cat_id[0] += 1
    cat = {"id": cid, "name": body.get("name",""), "slug": body.get("slug",""),
           "icon": body.get("icon","gift"), "description": body.get("description","")}
    categories_db.append(cat)
    return cat

@router.put("/categories/{cat_id}")
async def update_category(cat_id: int, request: Request):
    _verify(request)
    body = await request.json()
    cat = next((c for c in categories_db if c["id"] == cat_id), None)
    if not cat:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.items():
        cat[k] = v
    return cat

@router.delete("/categories/{cat_id}")
async def delete_category(cat_id: int, request: Request):
    _verify(request)
    categories_db[:] = [c for c in categories_db if c["id"] != cat_id]
    return {"message": "Deleted"}

# ═══════════════════════════════════════════════════════════════════════════════
# ORDERS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/orders")
async def list_orders(request: Request):
    _verify(request)
    status_f = request.query_params.get("status")
    result = [o for o in orders_db if o["status"] == status_f] if status_f else orders_db
    return sorted(result, key=lambda o: o["created_at"], reverse=True)

@router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    _verify(request)
    o = next((o for o in orders_db if o["id"] == order_id), None)
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    return o

@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, request: Request, background_tasks: BackgroundTasks):
    _verify(request)
    body = await request.json()
    o = next((o for o in orders_db if o["id"] == order_id), None)
    if not o:
        raise HTTPException(status_code=404, detail="Not found")
    o["status"] = body.get("status", o["status"])
    o["updated_at"] = datetime.utcnow().isoformat()
    if "tracking_number" in body: o["tracking_number"] = body["tracking_number"]
    if "courier"         in body: o["courier"]          = body["courier"]
    if "notes"           in body: o["notes"]            = body["notes"]
    if EMAIL_USERNAME:
        background_tasks.add_task(_send_order_email, dict(o))
    return o

@router.delete("/orders/{order_id}")
async def delete_order(order_id: str, request: Request):
    _verify(request)
    orders_db[:] = [o for o in orders_db if o["id"] != order_id]
    return {"message": "Deleted"}

# ═══════════════════════════════════════════════════════════════════════════════
# CUSTOMERS / USERS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/customers")
@router.get("/users")
async def list_customers(request: Request):
    _verify(request)
    return customers_db

@router.delete("/customers/{cid}")
async def delete_customer(cid: int, request: Request):
    _verify(request)
    customers_db[:] = [c for c in customers_db if c["id"] != cid]
    return {"message": "Deleted"}
