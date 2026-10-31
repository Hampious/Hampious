from fastapi import APIRouter, HTTPException, Request
from datetime import datetime
import uuid

from database import db_select, db_insert, db_delete, db_update

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


@router.get("/wishlist")
async def get_wishlist(request: Request):
    """Retrieve all wishlist items for current user."""
    email = _get_email(request)
    try:
        items = db_select("wishlists", {"email": email})
        return {"items": items}
    except Exception as e:
        print(f"[get_wishlist] DB error: {e}")
        return {"items": []}


@router.post("/wishlist/add/{product_id}")
async def add_to_wishlist(product_id: str, request: Request):
    """Add a product to user's wishlist."""
    email = _get_email(request)
    try:
        existing = db_select("wishlists", {"email": email, "product_id": str(product_id)})
        if not existing:
            db_insert("wishlists", {
                "id": str(uuid.uuid4()),
                "email": email,
                "product_id": str(product_id),
                "created_at": datetime.utcnow().isoformat()
            })
        return {"message": "Item added to wishlist"}
    except Exception as e:
        print(f"[add_to_wishlist] DB error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add item to wishlist")


@router.post("/wishlist/remove/{product_id}")
@router.delete("/wishlist/remove/{product_id}")
async def remove_from_wishlist(product_id: str, request: Request):
    """Remove a product from user's wishlist."""
    email = _get_email(request)
    try:
        db_delete("wishlists", {"email": email, "product_id": str(product_id)})
        return {"message": "Item removed from wishlist"}
    except Exception as e:
        print(f"[remove_from_wishlist] DB error: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove item from wishlist")
