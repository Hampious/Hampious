from fastapi import APIRouter, HTTPException
from typing import Optional

router = APIRouter()

# Lazy import to avoid circular imports at module load time
def _get_stores():
    from routes.admin_routes import products_db, categories_db
    return products_db, categories_db

def _stock_info(p):
    item = dict(p)
    s = item.get("stock", 0)
    item["stock_status"] = "out_of_stock" if s == 0 else ("low_stock" if s <= 3 else "in_stock")
    item["stock_label"]  = "Out of Stock" if s == 0 else (f"Only {s} left!" if s <= 3 else "")
    return item

@router.get("/")
def get_products(category: Optional[str] = None, featured: Optional[bool] = None, skip: int = 0, limit: int = 50):
    products_db, _ = _get_stores()
    result = list(products_db)
    if category:
        result = [p for p in result if p.get("category") == category]
    if featured is not None:
        result = [p for p in result if p.get("is_featured") == featured]
    return [_stock_info(p) for p in result[skip:skip + limit]]

@router.get("/categories")
def get_categories():
    _, categories_db = _get_stores()
    return categories_db

@router.get("/{product_id}")
def get_product(product_id: int):
    products_db, _ = _get_stores()
    product = next((p for p in products_db if p["id"] == product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _stock_info(product)
