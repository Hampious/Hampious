from fastapi import APIRouter, HTTPException, Request, Body
from typing import Optional, List
from datetime import datetime
import os

from database import db_select, db_insert, db_update, db_delete, db_upsert, get_db
from email_utils import send_email, _email_wrap

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "team.hampious@gmail.com")

router = APIRouter()


def _stock_info(p):
    item = dict(p)
    s = item.get("stock", 0)
    item["stock_status"] = "out_of_stock" if s == 0 else ("low_stock" if s <= 3 else "in_stock")
    item["stock_label"]  = "Out of Stock" if s == 0 else (f"Only {s} left!" if s <= 3 else "")
    return item


FALLBACK_PRODUCTS = [
    {
        "id": 1,
        "name": "The Ultimate Period Care & Warmth Box",
        "price": 1499.0,
        "discount_price": 1499.0,
        "original_price": 1999.0,
        "category": "Period Care",
        "category_id": "period",
        "description": "A cozy, soothing care hamper containing a heat pad, organic herbal teas, luxury dark chocolates, plush socks, and a personalized message card.",
        "images": ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop"],
        "stock": 25,
        "tags": ["period care", "self care", "wellness"],
        "is_featured": True,
        "featured": True,
        "is_active": True,
        "average_rating": 4.9,
        "review_count": 28,
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": 2,
        "name": "Luxurious Love & Romance Gift Set",
        "price": 2299.0,
        "discount_price": 2299.0,
        "original_price": 2799.0,
        "category": "I Love You",
        "category_id": "love",
        "description": "Express your deepest feelings with a handcrafted scented soy candle, premium Belgian chocolates, a velvet rose bouquet, and a customized keepsake photo card.",
        "images": ["https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop"],
        "stock": 20,
        "tags": ["love", "romance", "anniversary"],
        "is_featured": True,
        "featured": True,
        "is_active": True,
        "average_rating": 5.0,
        "review_count": 34,
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": 3,
        "name": "Grand Birthday Celebration Hamper",
        "price": 1899.0,
        "discount_price": 1899.0,
        "original_price": 2499.0,
        "category": "Birthday",
        "category_id": "birthday",
        "description": "Make birthdays unforgettable! Includes gourmet party snacks, sparkling celebration drink, party poppers, a custom mug, and birthday wish scroll.",
        "images": ["https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800&auto=format&fit=crop"],
        "stock": 18,
        "tags": ["birthday", "celebration", "gifts"],
        "is_featured": True,
        "featured": True,
        "is_active": True,
        "average_rating": 4.8,
        "review_count": 19,
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": 4,
        "name": "Heartfelt \"I am Sorry\" Healing Box",
        "price": 1699.0,
        "discount_price": 1699.0,
        "original_price": 2099.0,
        "category": "Sorry",
        "category_id": "sorry",
        "description": "Say sorry from the bottom of your heart with handwritten apology cards, sweet treats, lavender essential oil spray, and a cute teddy plushie.",
        "images": ["https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?q=80&w=800&auto=format&fit=crop"],
        "stock": 12,
        "tags": ["sorry", "apology", "comfort"],
        "is_featured": True,
        "featured": True,
        "is_active": True,
        "average_rating": 4.9,
        "review_count": 15,
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": 5,
        "name": "Serene Spa & Self Care Sanctuary",
        "price": 1999.0,
        "discount_price": 1999.0,
        "original_price": 2599.0,
        "category": "Self Care",
        "category_id": "selfcare",
        "description": "Indulge in home relaxation with bath salts, essential oils, body butter, a silk eye mask, and soothing green tea sachets.",
        "images": ["https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop"],
        "stock": 15,
        "tags": ["self care", "spa", "relaxation"],
        "is_featured": True,
        "featured": True,
        "is_active": True,
        "average_rating": 5.0,
        "review_count": 42,
        "created_at": datetime.utcnow().isoformat()
    },
    {
        "id": 6,
        "name": "Festive Delight Royal Hamper",
        "price": 2499.0,
        "discount_price": 2499.0,
        "original_price": 3199.0,
        "category": "Festive",
        "category_id": "festive",
        "description": "Celebrate special occasions with artisan dry fruits, handcrafted brass diyas, rich Indian sweets, and gold-embossed greeting cards.",
        "images": ["https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop"],
        "stock": 22,
        "tags": ["festive", "celebration", "royal"],
        "is_featured": True,
        "featured": True,
        "is_active": True,
        "average_rating": 4.9,
        "review_count": 27,
        "created_at": datetime.utcnow().isoformat()
    }
]


@router.get("/")
def get_products(category: Optional[str] = None, featured: Optional[bool] = None, is_featured: Optional[bool] = None, skip: int = 0, limit: int = 50):
    try:
        filters = {}
        if category:
            filters["category"] = category
        feat_val = featured if featured is not None else is_featured
        if feat_val is not None:
            filters["is_featured"] = feat_val
        products = db_select("products", filters if filters else None)
        if not products:
            products = FALLBACK_PRODUCTS
            if category:
                products = [p for p in products if p.get("category", "").lower() == category.lower() or p.get("category_id", "").lower() == category.lower()]
            if feat_val is not None:
                products = [p for p in products if p.get("is_featured") == feat_val or p.get("featured") == feat_val]
        return [_stock_info(p) for p in products[skip:skip + limit]]
    except Exception as e:
        print(f"[get_products] Supabase error: {e}")
        return [_stock_info(p) for p in FALLBACK_PRODUCTS[skip:skip + limit]]


@router.get("/categories")
def get_categories():
    try:
        return db_select("categories")
    except Exception as e:
        print(f"[get_categories] Supabase error: {e}")
        return []


@router.get("/{product_id}")
def get_product(product_id: str):
    pid_str = str(product_id).strip()
    try:
        rows = db_select("products", {"id": pid_str})
        if rows:
            return _stock_info(rows[0])
    except Exception as e:
        print(f"[get_product] Supabase error: {e}")

    clean_id = pid_str.replace("prod-", "")
    for p in FALLBACK_PRODUCTS:
        p_id_str = str(p.get("id"))
        if p_id_str == pid_str or p_id_str == clean_id or f"prod-{p_id_str}" == pid_str:
            return _stock_info(p)

    raise HTTPException(status_code=404, detail="Product not found")


# ── Reviews ───────────────────────────────────────────────────────────────────

@router.get("/{product_id}/reviews")
def get_reviews(product_id: str):
    """Public — no auth required."""
    try:
        rows = db_select("reviews", {"product_id": product_id})
        # Filter approved ones; if no approval column just return all
        approved = [r for r in rows if r.get("is_approved", True) or r.get("approval_status") == "approved"]
        return approved or rows  # fallback: return all if none approved yet
    except Exception as e:
        print(f"[get_reviews] error: {e}")
        return []


@router.post("/{product_id}/reviews")
async def create_review(product_id: str, request: Request, data: dict = Body(...)):
    """Requires auth token in Authorization header."""
    # Auth check
    token = request.headers.get("authorization", "").replace("Bearer ", "").replace("bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Login required to submit a review")

    # Get user from token (token = "token_email")
    user_email = token.replace("token_", "") if token.startswith("token_") else None
    if not user_email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_name = user_email.split("@")[0].title()
    try:
        rows = db_select("customers", {"email": user_email})
        if rows:
            user_name = rows[0].get("name", user_name)
    except: pass

    # Save review
    rating  = int(data.get("rating", 5))
    comment = str(data.get("comment", "")).strip()
    images  = data.get("images", [])  # list of URLs or base64

    if not comment:
        raise HTTPException(status_code=400, detail="Review comment is required")
    if not (1 <= rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    review = {
        "product_id":    product_id,
        "user_email":    user_email,
        "user_name":     user_name,
        "rating":        rating,
        "comment":       comment,
        "images":        images,
        "is_approved":   True,  # auto-approve; change to False for moderation
        "created_at":    datetime.utcnow().isoformat(),
    }

    try:
        saved = db_insert("reviews", review)
    except Exception as e:
        print(f"[create_review] DB error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save review")

    # Update product average rating
    try:
        all_reviews = db_select("reviews", {"product_id": product_id})
        if all_reviews:
            avg = sum(r.get("rating", 5) for r in all_reviews) / len(all_reviews)
            db_update("products", "id", int(product_id), {"average_rating": round(avg, 1), "review_count": len(all_reviews)})
    except Exception as e:
        print(f"[create_review] rating update error: {e}")

    # Notify admin via email
    try:
        product_name = product_id
        try:
            p = db_select("products", {"id": int(product_id)})
            if p: product_name = p[0].get("name", product_id)
        except: pass

        stars = "⭐" * rating
        body = f"""
        <div style="padding:2rem;font-family:'Georgia',serif;">
          <h2 style="color:#B84E78;">⭐ New Review on {product_name}</h2>
          <p><strong>Customer:</strong> {user_name} ({user_email})</p>
          <p><strong>Rating:</strong> {stars} ({rating}/5)</p>
          <div style="background:#FFF5F8;border-left:4px solid #D4789A;padding:1rem;margin:1rem 0;border-radius:4px;">
            <p style="margin:0;font-style:italic;">"{comment}"</p>
          </div>
          <a href="https://hampious-beta.vercel.app/admin/dashboard"
             style="display:inline-block;background:#D4789A;color:#fff;padding:10px 24px;border-radius:50px;text-decoration:none;font-weight:600;">
            View in Admin →
          </a>
        </div>"""
        send_email(ADMIN_EMAIL, f"⭐ New {rating}-star Review on {product_name}", _email_wrap(body))
    except Exception as e:
        print(f"[create_review] admin email error: {e}")

    return {"message": "Review submitted successfully", "review": review}


@router.get("/{product_id}/similar")
def get_similar(product_id: str):
    try:
        rows = db_select("products", {"id": int(product_id)})
        if not rows:
            return []
        cat = rows[0].get("category")
        if not cat:
            return []
        all_products = db_select("products", {"category": cat})
        similar = [_stock_info(p) for p in all_products if str(p.get("id")) != str(product_id)]
        return similar[:4]
    except Exception as e:
        print(f"[get_similar] error: {e}")
        return []
