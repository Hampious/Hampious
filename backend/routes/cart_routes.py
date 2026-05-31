from fastapi import APIRouter, HTTPException, Request
from datetime import datetime

router = APIRouter()

# In-memory cart store: { email: { items: [...] } }
# Each item: { product_id, quantity, price, added_at }
carts_db = {}


def _get_email(request: Request) -> str:
    """Extract user email from Bearer token (format: token_{email})."""
    auth = request.headers.get("authorization", "")
    token = auth.replace("Bearer ", "").replace("bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    # Token format: token_{email}
    if token.startswith("token_"):
        email = token[len("token_"):]
        if email:
            return email
    raise HTTPException(status_code=401, detail="Invalid token")


def _get_cart(email: str) -> dict:
    if email not in carts_db:
        carts_db[email] = {"items": []}
    return carts_db[email]


@router.get("/cart")
async def get_cart(request: Request):
    email = _get_email(request)
    cart = _get_cart(email)
    return cart


@router.post("/cart/add")
async def add_to_cart(request: Request):
    email = _get_email(request)
    body = await request.json()

    product_id = body.get("product_id")
    quantity = int(body.get("quantity", 1))
    price = float(body.get("price", 0))

    if not product_id:
        raise HTTPException(status_code=400, detail="product_id is required")

    cart = _get_cart(email)

    # Check if item already in cart — increase quantity
    for item in cart["items"]:
        if str(item["product_id"]) == str(product_id):
            item["quantity"] += quantity
            item["updated_at"] = datetime.utcnow().isoformat()
            return cart

    # Add new item
    cart["items"].append({
        "product_id": product_id,
        "quantity": quantity,
        "price": price,
        "added_at": datetime.utcnow().isoformat(),
    })
    return cart


@router.post("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, request: Request):
    email = _get_email(request)
    cart = _get_cart(email)
    cart["items"] = [i for i in cart["items"] if str(i["product_id"]) != str(product_id)]
    return cart


@router.put("/cart/update/{product_id}")
async def update_cart_item(product_id: str, request: Request):
    email = _get_email(request)
    body = await request.json()
    quantity = int(body.get("quantity", 1))
    cart = _get_cart(email)

    for item in cart["items"]:
        if str(item["product_id"]) == str(product_id):
            if quantity <= 0:
                cart["items"] = [i for i in cart["items"] if str(i["product_id"]) != str(product_id)]
            else:
                item["quantity"] = quantity
                item["updated_at"] = datetime.utcnow().isoformat()
            break
    return cart


@router.post("/cart/clear")
async def clear_cart(request: Request):
    email = _get_email(request)
    carts_db[email] = {"items": []}
    return {"items": []}
