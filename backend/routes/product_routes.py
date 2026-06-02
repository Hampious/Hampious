from fastapi import APIRouter, HTTPException
from typing import Optional

from database import db_select, db_insert, db_update, db_delete, db_upsert, get_db

router = APIRouter()


def _stock_info(p):
    item = dict(p)
    s = item.get("stock", 0)
    item["stock_status"] = "out_of_stock" if s == 0 else ("low_stock" if s <= 3 else "in_stock")
    item["stock_label"]  = "Out of Stock" if s == 0 else (f"Only {s} left!" if s <= 3 else "")
    return item


@router.get("/")
def get_products(category: Optional[str] = None, featured: Optional[bool] = None, skip: int = 0, limit: int = 50):
    try:
        filters = {}
        if category:
            filters["category"] = category
        if featured is not None:
            filters["is_featured"] = featured
        products = db_select("products", filters if filters else None)
        return [_stock_info(p) for p in products[skip:skip + limit]]
    except Exception as e:
        print(f"[get_products] Supabase error: {e}")
        return []


@router.get("/categories")
def get_categories():
    try:
        return db_select("categories")
    except Exception as e:
        print(f"[get_categories] Supabase error: {e}")
        return []


@router.get("/{product_id}")
def get_product(product_id: int):
    try:
        rows = db_select("products", {"id": product_id})
        if not rows:
            raise HTTPException(status_code=404, detail="Product not found")
        return _stock_info(rows[0])
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_product] Supabase error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch product")
