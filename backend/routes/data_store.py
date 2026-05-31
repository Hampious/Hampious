"""
Shared in-memory data store for Hampious.
All modules import from here so admin changes reflect on the customer site instantly.
"""
from datetime import datetime

# ─── Categories ────────────────────────────────────────────────────────────────
categories_db = [
    {"id": 1, "name": "Birthday",    "slug": "birthday",    "icon": "🎂", "description": "Birthday hampers"},
    {"id": 2, "name": "Love",        "slug": "love",        "icon": "❤️", "description": "Love & romance hampers"},
    {"id": 3, "name": "Period Care", "slug": "period",      "icon": "🌸", "description": "Period care & wellness"},
    {"id": 4, "name": "Sorry",       "slug": "sorry",       "icon": "💝", "description": "Apology & sorry hampers"},
    {"id": 5, "name": "Festive",     "slug": "festive",     "icon": "✨", "description": "Festive & celebration"},
    {"id": 6, "name": "Self Care",   "slug": "self-care",   "icon": "🛁", "description": "Self care & wellness"},
]

# ─── Products ───────────────────────────────────────────────────────────────────
products_db = [
    {
        "id": 1,
        "name": "Pink Birthday Bliss Hamper",
        "price": 1499,
        "original_price": 1999,
        "description": "A luxurious birthday hamper filled with premium chocolates, scented candles, skincare goodies, and a heartfelt card. Perfect to make her day unforgettable.",
        "category": "birthday",
        "images": ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600"],
        "stock": 15,
        "tags": ["birthday", "luxury", "chocolates"],
        "is_featured": True,
        "created_at": datetime.now().isoformat(),
    },
    {
        "id": 2,
        "name": "Love & Roses Hamper",
        "price": 1999,
        "original_price": 2499,
        "description": "Express your deepest feelings with this romantic hamper. Rose-infused bath products, artisan chocolates, a satin ribbon bear, and a personalised message card.",
        "category": "love",
        "images": ["https://images.unsplash.com/photo-1512909006721-3d6018887383?w=600"],
        "stock": 8,
        "tags": ["love", "roses", "romantic"],
        "is_featured": True,
        "created_at": datetime.now().isoformat(),
    },
    {
        "id": 3,
        "name": "Period Care Comfort Kit",
        "price": 899,
        "original_price": 1199,
        "description": "A thoughtful care kit with herbal teas, a heating pad, dark chocolates, soothing face mask, lavender essential oil, and a cosy pair of socks.",
        "category": "period",
        "images": ["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600"],
        "stock": 22,
        "tags": ["period", "wellness", "comfort"],
        "is_featured": True,
        "created_at": datetime.now().isoformat(),
    },
    {
        "id": 4,
        "name": "Forgive Me Hamper",
        "price": 1299,
        "original_price": 1599,
        "description": "Say sorry with grace. A curated hamper with scented candles, premium chocolates, a handwritten apology card, and a delicate flower arrangement.",
        "category": "sorry",
        "images": ["https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600"],
        "stock": 2,
        "tags": ["sorry", "apology", "flowers"],
        "is_featured": False,
        "created_at": datetime.now().isoformat(),
    },
]

# ─── Orders ────────────────────────────────────────────────────────────────────
orders_db = [
    {
        "id": "ORD-001",
        "customer_name": "Test User",
        "customer_email": "test@example.com",
        "customer_phone": "+91 9876543210",
        "items": [{"product_id": 1, "name": "Pink Birthday Bliss Hamper", "qty": 1, "price": 1499}],
        "subtotal": 1499,
        "shipping": 99,
        "total": 1598,
        "status": "processing",
        "payment_status": "paid",
        "shipping_address": {"line1": "123 MG Road", "city": "Bangalore", "state": "Karnataka", "pincode": "560001"},
        "tracking_number": None,
        "courier": None,
        "notes": "",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
]

# ─── Customers (mirror of auth users_db for admin view) ─────────────────────
customers_db = [
    {
        "id": 1,
        "email": "test@example.com",
        "name": "Test User",
        "phone": "",
        "total_orders": 1,
        "total_spent": 1598,
        "created_at": datetime.now().isoformat(),
    }
]

_order_counter = [2]  # mutable counter for auto-incrementing order IDs

def next_order_id():
    oid = f"ORD-{_order_counter[0]:03d}"
    _order_counter[0] += 1
    return oid

_product_counter = [5]

def next_product_id():
    pid = _product_counter[0]
    _product_counter[0] += 1
    return pid

_category_counter = [7]

def next_category_id():
    cid = _category_counter[0]
    _category_counter[0] += 1
    return cid
