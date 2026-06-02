from fastapi import APIRouter, HTTPException, Request
from datetime import datetime

from database import db_select, db_insert, db_update, db_delete, db_upsert, get_db

router = APIRouter()


def _get_email(request: Request) -> str:
    """Extract user email from Bearer token (format: token_{email})."""
    auth = request.headers.get("authorization", "")
    token = auth.replace("Bearer ", "").replace("bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if token.startswith("token_"):
        email = token[len("token_"):]
        if email:
            return email
    raise HTTPException(status_code=401, detail="Invalid token")


def _build_cart_response(items: list) -> dict:
    return {"items": items}


@router.get("/cart")
async def get_cart(request: Request):
    email = _get_email(request)
    try:
        items = db_select("cart", {"email": email})
        return _build_cart_response(items)
    except Exception as e:
        print(f"[get_cart] Supabase error: {e}")
        return {"items": []}


@router.post("/cart/add")
async def add_to_cart(request: Request):
    email = _get_email(request)
    body = await request.json()

    product_id = body.get("product_id")
    quantity   = int(body.get("quantity", 1))
    price      = float(body.get("price", 0))

    if not product_id:
        raise HTTPException(status_code=400, detail="product_id is required")

    now = datetime.utcnow().isoformat()

    try:
        existing_items = db_select("cart", {"email": email, "product_id": str(product_id)})
        if existing_items:
            item = existing_items[0]
            new_qty = item.get("quantity", 0) + quantity
            db_update("cart", "id", item["id"], {"quantity": new_qty, "updated_at": now})
        else:
            db_insert("cart", {
                "email":      email,
                "product_id": str(product_id),
                "quantity":   quantity,
                "price":      price,
                "added_at":   now,
                "updated_at": now,
            })
        items = db_select("cart", {"email": email})
        return _build_cart_response(items)
    except Exception as e:
        print(f"[add_to_cart] Supabase error: {e}")
        return {"items": []}


@router.post("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, request: Request):
    email = _get_email(request)
    try:
        rows = db_select("cart", {"email": email, "product_id": product_id})
        for row in rows:
            db_delete("cart", "id", row["id"])
        items = db_select("cart", {"email": email})
        return _build_cart_response(items)
    except Exception as e:
        print(f"[remove_from_cart] Supabase error: {e}")
        return {"items": []}


@router.put("/cart/update/{product_id}")
async def update_cart_item(product_id: str, request: Request):
    email = _get_email(request)
    body = await request.json()
    quantity = int(body.get("quantity", 1))
    now = datetime.utcnow().isoformat()

    try:
        rows = db_select("cart", {"email": email, "product_id": product_id})
        for row in rows:
            if quantity <= 0:
                db_delete("cart", "id", row["id"])
            else:
                db_update("cart", "id", row["id"], {"quantity": quantity, "updated_at": now})
        items = db_select("cart", {"email": email})
        return _build_cart_response(items)
    except Exception as e:
        print(f"[update_cart_item] Supabase error: {e}")
        return {"items": []}


@router.post("/cart/clear")
async def clear_cart(request: Request):
    email = _get_email(request)
    try:
        rows = db_select("cart", {"email": email})
        for row in rows:
            db_delete("cart", "id", row["id"])
    except Exception as e:
        print(f"[clear_cart] Supabase error: {e}")
    return {"items": []}
