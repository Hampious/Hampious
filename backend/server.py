from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, status, Body, UploadFile, File, Response, Cookie, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.openapi.utils import get_openapi
from dotenv import load_dotenv
from db import supabase
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import json
from pathlib import Path
from typing import Optional, List, Any
import uuid
from datetime import datetime, timezone, timedelta
import razorpay
import httpx
import hmac
import hashlib
import asyncio
import resend
from models import (
    User, UserCreate, UserLogin, UserRole,
    Category, CategoryCreate,
    Product, ProductCreate,
    Cart, CartItem,
    Order, OrderCreate, OrderStatus, ReturnStatus, ReviewApprovalStatus,
    Coupon, CouponCreate,
    HeroSlide, HeroSlideCreate,
    Wishlist, WishlistItem,
    Address, AddressCreate,
    Review, ReviewCreate, GiftOptions, ReturnRequest, UserSession
)
from auth import hash_password, verify_password, create_access_token, decode_access_token

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ==================== ENV VALIDATION & CONFIG ====================
REQUIRED_ENV_VARS = [
    "SUPABASE_URL", "SUPABASE_KEY", "JWT_SECRET", 
    "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"
]

for var in REQUIRED_ENV_VARS:
    if not os.environ.get(var):
        raise RuntimeError(f"⛔ FATAL: Missing Required Environment Variable: {var}")

razorpay_client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID'), os.environ.get('RAZORPAY_KEY_SECRET')))
RAZORPAY_WEBHOOK_SECRET = os.environ.get('RAZORPAY_WEBHOOK_SECRET', '')

# Global Configs
SUPPORT_PHONE = os.environ.get('SUPPORT_PHONE', '+91 7428601664')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@hampious.com')

# Resend email configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')

app = FastAPI()

# ==================== SWAGGER / OPENAPI CONFIG ====================
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Hampious API",
        version="1.0.0",
        description="Premium Gift Hampers E-commerce API",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }

    openapi_schema["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

api_router = APIRouter(prefix="/api")

security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MIDDLEWARE ====================

@app.middleware("http")
async def timeout_middleware(request: Request, call_next):
    try:
        return await asyncio.wait_for(call_next(request), timeout=25)
    except asyncio.TimeoutError:
        return Response("Request timed out", status_code=504)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming Request: {request.method} {request.url.path}")
    response = await call_next(request)
    return response

# ==================== STORAGE HELPER ====================

async def upload_to_supabase(file: UploadFile, bucket: str = "media", folder: str = "uploads") -> str:
    try:
        contents = await file.read()
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
        file_name = f"{folder}/{uuid.uuid4()}.{file_ext}"
        
        res = supabase.storage.from_(bucket).upload(
            file_name, 
            contents, 
            file_options={"content-type": file.content_type}
        )
        
        if isinstance(res, dict) and res.get("error"):
             raise Exception(f"Storage upload failed: {res['error']}")

        public_url = supabase.storage.from_(bucket).get_public_url(file_name)
        return public_url
        
    except Exception as e:
        logger.error(f"Supabase Storage Upload Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

# ==================== EMAIL NOTIFICATION SERVICE ====================

def send_email_notification_task(to_email: str, subject: str, html_content: str):
    """Background task for sending emails"""
    if not resend.api_key:
        logger.warning("Resend API key not configured, skipping email")
        return
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        resend.Emails.send(params)
        logger.info(f"Email sent to {to_email}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")

def get_order_email_html(order: dict, status: str, extra_info: str = "") -> str:
    items_html = ""
    for item in (order.get("items") or []):
        items_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{item.get('product_name', 'Product')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹{item.get('price', 0):.0f}</td>
        </tr>
        """
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #c9a9a9 0%, #8b7355 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #fff; padding: 30px; border: 1px solid #eee; }}
            .footer {{ background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }}
            .status {{ display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }}
            .status-confirmed {{ background: #e8f5e9; color: #2e7d32; }}
            .status-shipped {{ background: #e3f2fd; color: #1565c0; }}
            .status-delivered {{ background: #f3e5f5; color: #7b1fa2; }}
            .status-refunded {{ background: #fff3e0; color: #ef6c00; }}
            table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            th {{ background: #f5f5f5; padding: 12px; text-align: left; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Hampious</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">Premium Gift Hampers</p>
            </div>
            <div class="content">
                <h2>Order {status}</h2>
                <p class="status status-{status.lower().replace(' ', '-')}">{status}</p>
                <p><strong>Order ID:</strong> #{order.get('id', '')[:8].upper()}</p>
                <p><strong>Date:</strong> {datetime.now().strftime('%B %d, %Y')}</p>
                {extra_info}
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2" style="padding: 10px; font-weight: bold;">Total</td>
                            <td style="padding: 10px; font-weight: bold; text-align: right;">₹{order.get('final_amount', 0):.0f}</td>
                        </tr>
                    </tfoot>
                </table>
                <p>Thank you for shopping with Hampious!</p>
            </div>
            <div class="footer">
                <p>Hampious - Premium Gift Hampers</p>
                <p>support@hampious.com | {SUPPORT_PHONE}</p>
            </div>
        </div>
    </body>
    </html>
    """

async def notify_order_status(order: dict, status: str, background_tasks: BackgroundTasks, extra_info: str = ""):
    """Queue order status notification email (Safe Version with Crash Guard)"""
    try:
        if not order:
            return

        try:
            user_res = supabase.table("users").select("email").eq("id", order.get("user_id")).execute()
        except Exception as e:
            logger.error(f"User lookup failed for notification: {e}")
            return
        
        if not user_res.data:
            return
            
        user = user_res.data[0]
        
        if not user.get("email"):
            return
        
        subject_map = {
            "confirmed": "Your Hampious Order is Confirmed! 🎁",
            "shipped": "Your Hampious Order has been Shipped! 📦",
            "out_for_delivery": "Your Hampious Order is Out for Delivery! 🚚",
            "delivered": "Your Hampious Order has been Delivered! ✨",
            "return_approved": "Your Return Request has been Approved",
            "return_rejected": "Your Return Request Update",
            "refunded": "Your Refund has been Processed 💰"
        }
        
        subject = subject_map.get(status, f"Hampious Order Update: {status}")
        html = get_order_email_html(order, status.replace("_", " ").title(), extra_info)
        
        background_tasks.add_task(send_email_notification_task, user["email"], subject, html)
    except Exception as e:
        logger.error(f"⚠️ Notification System Error: {str(e)}")

# ==================== AUTH DEPENDENCIES ====================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired token"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    
    user_res = supabase.table("users").select("*").eq("id", user_id).execute()
    
    if not user_res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    return user_res.data[0]

async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    existing = supabase.table("users").select("id").eq("email", user_data.email).execute()

    if existing.data:
        raise HTTPException(status_code=400, detail="Email already exists")

    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(user_data.password)
    
    user_doc = {
        "id": user_id,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "email": user_data.email,
        "phone": user_data.phone,
        "password": hashed_pwd,
        "role": UserRole.USER,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    supabase.table("users").insert(user_doc).execute()
    token = create_access_token({"sub": user_id, "email": user_data.email, "role": UserRole.USER})
    
    user_response = User(**{k: v for k, v in user_doc.items() if k != "password"})
    return {"token": token, "user": user_response}

@api_router.post("/auth/signin")
async def signin(credentials: UserLogin):
    user_res = supabase.table("users").select("*").eq("email", credentials.email).execute()
    
    if not user_res.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    user = user_res.data[0]
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
    user_response = User(**{k: v for k, v in user.items() if k != "password"})
    return {"token": token, "user": user_response}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

@api_router.post("/auth/google/login")
async def google_auth_login(data: dict = Body(...)):
    token = data.get("id_token") or data.get("access_token") or data.get("session_id")
    if not token:
        raise HTTPException(status_code=400, detail="Token required (id_token, access_token, or session_id)")
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}")
            
            if resp.status_code != 200:
                resp = await client.get(f"https://www.googleapis.com/oauth2/v3/userinfo", headers={"Authorization": f"Bearer {token}"})
                
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid Google Token")
                
            google_data = resp.json()
            
        email = google_data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email not found in Google account")
            
        name = google_data.get("name", "")
        picture = google_data.get("picture", "")
        
        user_res = supabase.table("users").select("*").eq("email", email).execute()
        
        if user_res.data:
            existing_user = user_res.data[0]
            supabase.table("users").update({"picture": picture}).eq("id", existing_user["id"]).execute()
            user_id = existing_user["id"]
            role = existing_user.get("role", UserRole.USER)
        else:
            user_id = str(uuid.uuid4())
            name_parts = name.split(" ", 1)
            first_name = name_parts[0] if name_parts else "User"
            last_name = name_parts[1] if len(name_parts) > 1 else ""
            
            user_doc = {
                "id": user_id,
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "phone": "",
                "picture": picture,
                "password": "", 
                "role": UserRole.USER,
                "is_active": True,
                "auth_provider": "google",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            supabase.table("users").insert(user_doc).execute()
            role = UserRole.USER
            
        jwt_token = create_access_token({"sub": user_id, "email": email, "role": role})
        
        final_user_res = supabase.table("users").select("*").eq("id", user_id).execute()
        return {"token": jwt_token, "user": final_user_res.data[0]}
        
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")

# ==================== UPLOAD ROUTES ====================

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    try:
        url = await upload_to_supabase(file, "media", "uploads")
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/upload/images")
async def upload_multiple_images(files: List[UploadFile] = File(...), current_user: dict = Depends(get_current_user)):
    urls = []
    for file in files:
        if not file.content_type.startswith("image/"):
            continue
        try:
            url = await upload_to_supabase(file, "media", "uploads")
            urls.append(url)
        except Exception as e:
            logger.error(f"Batch upload error for file {file.filename}: {e}")
    
    return {"urls": urls}

# ==================== CATALOG ROUTES ====================

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    result = supabase.table("categories").select("*").eq("is_active", True).execute()
    return result.data

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate, admin: dict = Depends(get_admin_user)):
    category_id = str(uuid.uuid4())
    category_doc = {
        "id": category_id,
        **category_data.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table("categories").insert(category_doc).execute()
    return Category(**category_doc)

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_data: CategoryCreate, admin: dict = Depends(get_admin_user)):
    result = supabase.table("categories").update(category_data.model_dump()).eq("id", category_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Category not found")
    return Category(**result.data[0])

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, admin: dict = Depends(get_admin_user)):
    result = supabase.table("categories").delete().eq("id", category_id).execute()
    pass 
    return {"message": "Category deleted"}

@api_router.get("/products", response_model=List[Product])
async def get_products(category_id: Optional[str] = None, featured: Optional[bool] = None, sort_by: Optional[str] = "created_at"):
    query = supabase.table("products").select("*").eq("is_active", True)
    
    if category_id:
        query = query.eq("category_id", category_id)
    if featured is not None:
        query = query.eq("featured", featured)
    
    if sort_by == "price_desc":
        query = query.order("price", desc=True)
    elif sort_by == "price":
        query = query.order("price", desc=False)
    else:
        query = query.order("created_at", desc=True)
    
    return query.execute().data

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    res = supabase.table("products").select("*").eq("id", product_id).eq("is_active", True).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return res.data[0]

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, admin: dict = Depends(get_admin_user)):
    product_id = str(uuid.uuid4())
    product_doc = {
        "id": product_id,
        **product_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table("products").insert(product_doc).execute()
    return Product(**product_doc)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductCreate, admin: dict = Depends(get_admin_user)):
    result = supabase.table("products").update(product_data.model_dump()).eq("id", product_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**result.data[0])

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(get_admin_user)):
    result = supabase.table("products").delete().eq("id", product_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ==================== CART ROUTES ====================

@api_router.get("/cart", response_model=Cart)
async def get_cart(current_user: dict = Depends(get_current_user)):
    res = supabase.table("carts").select("*").eq("user_id", current_user["id"]).execute()
    
    if not res.data:
        cart_id = str(uuid.uuid4())
        cart = {
            "id": cart_id,
            "user_id": current_user["id"],
            "items": []
        }
        supabase.table("carts").insert(cart).execute()
        return Cart(**cart)
        
    return Cart(**res.data[0])

@api_router.post("/cart/add")
async def add_to_cart(item: CartItem, current_user: dict = Depends(get_current_user)):
    res = supabase.table("carts").select("*").eq("user_id", current_user["id"]).execute()
    
    if not res.data:
        cart_id = str(uuid.uuid4())
        cart = {
            "id": cart_id,
            "user_id": current_user["id"],
            "items": [item.model_dump()]
        }
        supabase.table("carts").insert(cart).execute()
    else:
        cart = res.data[0]
        items = cart.get("items", [])
        found = False
        for i, existing_item in enumerate(items):
            if existing_item["product_id"] == item.product_id:
                items[i]["quantity"] += item.quantity
                found = True
                break
        if not found:
            items.append(item.model_dump())
        
        supabase.table("carts").update({
            "items": items
        }).eq("user_id", current_user["id"]).execute()
    
    return {"message": "Item added to cart"}

@api_router.post("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, current_user: dict = Depends(get_current_user)):
    res = supabase.table("carts").select("*").eq("user_id", current_user["id"]).execute()
    
    if res.data:
        cart = res.data[0]
        items = [item for item in cart.get("items", []) if item["product_id"] != product_id]
        supabase.table("carts").update({
            "items": items
        }).eq("user_id", current_user["id"]).execute()
        
    return {"message": "Item removed from cart"}

@api_router.post("/cart/clear")
async def clear_cart(current_user: dict = Depends(get_current_user)):
    supabase.table("carts").update({
        "items": []
    }).eq("user_id", current_user["id"]).execute()
    
    return {"message": "Cart cleared"}

# ==================== ORDER ROUTES ====================

@api_router.post("/orders/create", response_model=Order)
async def create_order(
    order_data: OrderCreate, 
    background_tasks: BackgroundTasks, 
    current_user: dict = Depends(get_current_user)
):
    # 0. Prevent empty orders
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Order must contain items")

    # 1. Validate Stock (Only check, do NOT decrement yet)
    for item in order_data.items:
        prod_res = supabase.table("products").select("name", "stock").eq("id", item.product_id).execute()
        if not prod_res.data:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        product = prod_res.data[0]
        current_stock = product.get("stock") or 0
        
        if current_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.get('name', 'Unknown')}")
    
    # NOTE: Stock decrement moved to /payment/verify to prevent stock loss on failed payments
    
    # 🔐 Enrich order items with product snapshot (image, name)
    enriched_items = []
    
    for item in order_data.items:
        prod_res = supabase.table("products") \
            .select("name, image, images") \
            .eq("id", item.product_id) \
            .execute()
    
        if not prod_res.data:
            raise HTTPException(status_code=404, detail="Product not found")
    
        product = prod_res.data[0]
    
        product_image = (
            product.get("image")
            or (product.get("images") or [None])[0]
        )
    
        enriched_items.append({
            "product_id": item.product_id,
            "product_name": product.get("name"),
            "product_image": product_image,
            "quantity": item.quantity,
            "price": item.price
        })

    order_id = str(uuid.uuid4())
    order_payload = order_data.model_dump()
    logger.info(f"ORDER PAYLOAD DEBUG: {order_payload}")

    # Strict allowed fields
    allowed_fields = [
        "items",
        "subtotal",
        "total",
        "discount_amount",
        "final_amount",
        "shipping_address",
        "payment_method",
        "razorpay_order_id",
        "payment_id",
        "coupon_code"
    ]
    
    shipping = order_payload.get("shipping_address")
    if not shipping or not isinstance(shipping, dict):
        shipping = {}

    safe_payload = {k: v for k, v in order_payload.items() if k in allowed_fields}

    # Strict total calculation
    subtotal = sum(item.price * item.quantity for item in order_data.items)
    discount = float(order_payload.get("discount_amount") or 0)

    computed_total = subtotal - discount
    final_amount = float(order_payload.get("final_amount") or computed_total)

    safe_payload["subtotal"] = subtotal
    safe_payload["discount_amount"] = discount
    safe_payload["final_amount"] = final_amount
    safe_payload["total"] = final_amount

    # SAFE FINAL order_doc
    order_doc = {
        "id": order_id,
        "user_id": current_user["id"],

        "subtotal": safe_payload["subtotal"],
        "total": safe_payload["total"],
        "discount_amount": safe_payload["discount_amount"],
        "final_amount": safe_payload["final_amount"],

        "items": enriched_items,
        "shipping_address": shipping,

        "razorpay_order_id": safe_payload.get("razorpay_order_id") or None,
        "payment_id": safe_payload.get("payment_id") or None,
        "coupon_code": safe_payload.get("coupon_code") or None,

        "payment_method": safe_payload.get("payment_method") or "razorpay",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        result = supabase.table("orders").insert(order_doc).execute()

        if not result.data:
            logger.error("❌ ORDER INSERT FAILED: No data returned")
            logger.error(f"Payload sent: {order_doc}")
            logger.error(f"Supabase response: {result}")
            raise HTTPException(status_code=500, detail="Order DB insert failed")

    except Exception as e:
        logger.error(f"❌ ORDER INSERT EXCEPTION: {str(e)}")
        logger.error(f"Payload sent: {order_doc}")
        raise HTTPException(status_code=500, detail="Order DB insert failed")
    
    supabase.table("carts").update({"items": []}).eq("user_id", current_user["id"]).execute()
    
    return Order(**result.data[0])

@api_router.get("/orders/my", response_model=List[Order])
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    res = supabase.table("orders").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).execute()
    return res.data

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    res = supabase.table("orders").select("*").eq("id", order_id).eq("user_id", current_user["id"]).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**res.data[0])

# ==================== PAYMENT ROUTES ====================

@api_router.post("/payment/create-razorpay-order")
async def create_razorpay_order(data: Any = Body(...), current_user: dict = Depends(get_current_user)):
    try:
        if isinstance(data, (int, float)):
            amount = float(data)
        elif isinstance(data, dict):
            amount = float(data.get("amount", 0))
        else:
            try:
                amount = float(data)
            except:
                raise HTTPException(status_code=400, detail="Invalid data format")

        if amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid payment amount")

        razorpay_order = razorpay_client.order.create({
            "amount": int(amount * 100),
            "currency": "INR",
            "receipt": f"rcpt_{uuid.uuid4().hex[:20]}",
            "payment_capture": 1
        })
        return razorpay_order
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/payment/verify")
async def verify_payment(
    data: dict = Body(...),
    background_tasks: BackgroundTasks = None
):
    try:
        payment_id = data.get("payment_id")
        razorpay_order_id = data.get("razorpay_order_id")
        signature = data.get("signature")

        if not all([payment_id, razorpay_order_id, signature]):
            raise HTTPException(status_code=400, detail="Missing payment details")

        # 1️⃣ Verify Razorpay signature
        params_dict = {
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        }
        try:
            razorpay_client.utility.verify_payment_signature(params_dict)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid payment signature")

        # 2️⃣ Find order (safe OR lookup) - Checks if order exists with either razorpay ID or Payment ID
        res = supabase.table("orders").select("*").or_(
            f"razorpay_order_id.eq.{razorpay_order_id},payment_id.eq.{payment_id}"
        ).execute()

        if not res.data:
            # Fallback: try finding by order_id if provided by frontend
            order_id = data.get("order_id")
            if order_id:
                res = supabase.table("orders").select("*").eq("id", order_id).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="Order not found")

        order = res.data[0]

        # 3️⃣ Idempotency guard (if already paid, return success)
        if order.get("status") == "confirmed" or order.get("payment_status") == "captured":
            return {"verified": True, "message": "Already confirmed"}

        # 4️⃣ Update order
        supabase.table("orders").update({
            "status": "confirmed",
            "payment_status": "captured",
            "razorpay_payment_id": payment_id,
            "payment_id": payment_id,
            "paid_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", order["id"]).execute()

        # 5️⃣ Decrement Stock (Moved here to ensure successful payment first)
        try:
            for item in (order.get("items") or []):
                 supabase.rpc(
                    "decrement_stock",
                    {"pid": item["product_id"], "qty": item["quantity"]}
                ).execute()
        except Exception as e:
            logger.error(f"Stock decrement failed post-payment: {e}")

        # 6️⃣ Fetch updated order data for email (Ensure latest status)
        updated_order_res = supabase.table("orders").select("*").eq("id", order["id"]).execute()
        final_order = updated_order_res.data[0] if updated_order_res.data else order

        # 7️⃣ Notify safely
        try:
            if background_tasks:
                await notify_order_status(final_order, "confirmed", background_tasks)
        except Exception as e:
            logger.error(f"Email failed safely: {e}")

        return {"verified": True}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Payment verification error: {e}")
        raise HTTPException(status_code=400, detail="Payment verification failed")

# ==================== RAZORPAY WEBHOOK ====================

@api_router.post("/payment/webhook")
async def razorpay_webhook(request: Request, background_tasks: BackgroundTasks):
    if not RAZORPAY_WEBHOOK_SECRET:
        logger.error("Webhook secret missing")
        return {"status": "ignored"}

    try:
        body_bytes = await request.body()
        signature = request.headers.get("X-Razorpay-Signature", "")
        
        try:
            razorpay_client.utility.verify_webhook_signature(
                body_bytes.decode("utf-8"),
                signature,
                RAZORPAY_WEBHOOK_SECRET
            )
        except Exception:
            logger.warning("Invalid webhook signature")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        payload = json.loads(body_bytes)
        event = payload.get("event")
        
        logger.info(f"Razorpay webhook received: {event}")
        
        if event == "payment.captured":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            payment_id = payment_entity.get("id")
            razorpay_order_id = payment_entity.get("order_id")
            
            res = supabase.table("orders").select("*").eq("razorpay_order_id", razorpay_order_id).execute()
            
            if res.data:
                order = res.data[0]
                
                # Idempotency Guard: If already captured, exit early
                if order.get("payment_status") == "captured":
                    return {"status": "ok"}

                if order["status"] == "pending" or order.get("payment_status") != "captured":
                    supabase.table("orders").update({
                        "payment_status": "captured",
                        "razorpay_payment_id": payment_id,
                        "payment_id": payment_id,
                        "status": "confirmed",
                        "paid_at": datetime.now(timezone.utc).isoformat()
                    }).eq("razorpay_order_id", razorpay_order_id).execute()
                    
                    # Decrement Stock (Fallback in case frontend verify failed)
                    try:
                        for item in (order.get("items") or []):
                            supabase.rpc(
                                "decrement_stock",
                                {"pid": item["product_id"], "qty": item["quantity"]}
                            ).execute()
                    except Exception as e:
                        logger.error(f"Webhook stock decrement failed: {e}")

                    res = supabase.table("orders").select("*").eq("razorpay_order_id", razorpay_order_id).execute()
                    if res.data:
                         await notify_order_status(res.data[0], "confirmed", background_tasks)
                
        elif event == "payment.failed":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_order_id = payment_entity.get("order_id")
            
            supabase.table("orders").update({
                "payment_status": "failed"
            }).eq("razorpay_order_id", razorpay_order_id).execute()
            
        elif event == "refund.created" or event == "refund.processed":
            refund_entity = payload.get("payload", {}).get("refund", {}).get("entity", {})
            payment_id = refund_entity.get("payment_id")
            refund_id = refund_entity.get("id")
            refund_status = refund_entity.get("status")
            
            # Lookup via either column
            res = supabase.table("orders").select("*").or_(f"razorpay_payment_id.eq.{payment_id},payment_id.eq.{payment_id}").execute()
            
            if res.data:
                order = res.data[0]
                supabase.table("orders").update({
                    "razorpay_refund_id": refund_id,
                    "refund_status": refund_status,
                    "refunded_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", order["id"]).execute()
                
                if refund_status == "processed":
                    await notify_order_status(order, "refunded", background_tasks)
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error"}

# ==================== CMS / SITE SETTINGS ====================

@api_router.get("/cms/settings")
async def get_cms_settings():
    res = supabase.table("site_settings").select("*").eq("id", "main").execute()
    
    if res.data:
        return res.data[0]
    
    return {
        "id": "main",
        "hero_image": "",
        "hero_video": "",
        "hero_title": "Premium Gift Hampers",
        "hero_subtitle": "Curated with love, delivered with care",
        "about_video": "",
        "about_title": "Our Story",
        "about_description": "We believe in the art of gifting...",
        "return_policy": "We offer a 3-day return policy for damaged products.",
        "contact_email": "support@hampious.com",
        "contact_phone": SUPPORT_PHONE,
        "social_links": {}
    }

@api_router.put("/cms/settings")
async def update_cms_settings(data: dict = Body(...), admin: dict = Depends(get_admin_user)):
    data["id"] = "main"
    supabase.table("site_settings").upsert(data).execute()
    return {"message": "Settings updated successfully"}

@api_router.post("/cms/upload-hero")
async def upload_hero_media(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    is_video = file.content_type.startswith("video/")
    resource_type = "video" if is_video else "image"
    
    try:
        url = await upload_to_supabase(file, "media", "hero")
        field_name = "hero_video" if is_video else "hero_image"
        
        supabase.table("site_settings").upsert({
            "id": "main",
            field_name: url
        }).execute()
        
        return {"url": url, "type": resource_type}
    except Exception as e:
        logger.error(f"Hero upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload hero media")

@api_router.post("/cms/upload-about-video")
async def upload_about_video(file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    try:
        url = await upload_to_supabase(file, "media", "about")
        supabase.table("site_settings").upsert({
            "id": "main",
            "about_video": url
        }).execute()
        return {"url": url}
    except Exception as e:
        logger.error(f"About video upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload video")

# ==================== PRODUCT IMAGE UPLOAD ====================

@api_router.post("/admin/products/{product_id}/upload-image")
async def upload_product_image(product_id: str, file: UploadFile = File(...), admin: dict = Depends(get_admin_user)):
    res = supabase.table("products").select("*").eq("id", product_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Product not found")
    product = res.data[0]
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        image_url = await upload_to_supabase(file, "media", "products")
        images = product.get("images", [])
        if not images:
            images = []
        images.append(image_url)
        
        supabase.table("products").update({
            "image": image_url,
            "images": images
        }).eq("id", product_id).execute()
        
        return {"url": image_url, "message": "Product image uploaded"}
    except Exception as e:
        logger.error(f"Product image upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload product image")

@api_router.post("/admin/products/{product_id}/upload-images")
async def upload_product_images(product_id: str, files: List[UploadFile] = File(...), admin: dict = Depends(get_admin_user)):
    res = supabase.table("products").select("*").eq("id", product_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Product not found")
    product = res.data[0]
    
    uploaded_urls = []
    for file in files:
        if not file.content_type.startswith("image/"):
            continue
        try:
            url = await upload_to_supabase(file, "media", "products")
            uploaded_urls.append(url)
        except Exception as e:
            logger.error(f"Image upload error: {e}")
    
    if uploaded_urls:
        images = product.get("images", [])
        if not images: 
            images = []
        images.extend(uploaded_urls)
        
        update_data = {"images": images}
        if not product.get("image"):
            update_data["image"] = uploaded_urls[0]
            
        supabase.table("products").update(update_data).eq("id", product_id).execute()
    
    return {"urls": uploaded_urls, "count": len(uploaded_urls)}

@api_router.get("/coupons/validate/{code}")
async def validate_coupon(code: str, amount: float):
    res = supabase.table("coupons").select("*").eq("code", code).eq("is_active", True).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    coupon = res.data[0]
    
    expiry_raw = coupon.get("expiry_date")
    if expiry_raw:
        expiry_str = expiry_raw.replace("Z", "+00:00")
        if datetime.fromisoformat(expiry_str) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Coupon has expired")
    
    if coupon.get("usage_limit") and coupon.get("usage_count", 0) >= coupon["usage_limit"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    if amount < coupon.get("min_purchase", 0):
        raise HTTPException(status_code=400, detail=f"Minimum purchase of {coupon['min_purchase']} required")
    
    discount = 0
    if coupon["discount_type"] == "percentage":
        discount = (amount * coupon["discount_value"]) / 100
        if coupon.get("max_discount"):
            discount = min(discount, coupon["max_discount"])
    else:
        discount = coupon["discount_value"]
    
    return {"discount": discount, "coupon": Coupon(**coupon)}

@api_router.get("/coupons", response_model=List[Coupon])
async def get_coupons(admin: dict = Depends(get_admin_user)):
    res = supabase.table("coupons").select("*").execute()
    return res.data

@api_router.post("/coupons", response_model=Coupon)
async def create_coupon(coupon_data: CouponCreate, admin: dict = Depends(get_admin_user)):
    existing = supabase.table("coupons").select("*").eq("code", coupon_data.code).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon_id = str(uuid.uuid4())
    coupon_doc = {
        "id": coupon_id,
        **coupon_data.model_dump(),
        "usage_count": 0,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table("coupons").insert(coupon_doc).execute()
    return Coupon(**coupon_doc)

@api_router.put("/coupons/{coupon_id}", response_model=Coupon)
async def update_coupon(coupon_id: str, coupon_data: CouponCreate, admin: dict = Depends(get_admin_user)):
    result = supabase.table("coupons").update(coupon_data.model_dump()).eq("id", coupon_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return Coupon(**result.data[0])

@api_router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, admin: dict = Depends(get_admin_user)):
    result = supabase.table("coupons").delete().eq("id", coupon_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "Coupon deleted"}

@api_router.get("/hero-slides", response_model=List[HeroSlide])
async def get_hero_slides():
    res = supabase.table("hero_slides").select("*").eq("is_active", True).order("order").execute()
    return res.data

@api_router.post("/hero-slides", response_model=HeroSlide)
async def create_hero_slide(slide_data: HeroSlideCreate, admin: dict = Depends(get_admin_user)):
    slide_id = str(uuid.uuid4())
    slide_doc = {
        "id": slide_id,
        **slide_data.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table("hero_slides").insert(slide_doc).execute()
    return HeroSlide(**slide_doc)

@api_router.put("/hero-slides/{slide_id}", response_model=HeroSlide)
async def update_hero_slide(slide_id: str, slide_data: HeroSlideCreate, admin: dict = Depends(get_admin_user)):
    result = supabase.table("hero_slides").update(slide_data.model_dump()).eq("id", slide_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Hero slide not found")
    return HeroSlide(**result.data[0])

@api_router.delete("/hero-slides/{slide_id}")
async def delete_hero_slide(slide_id: str, admin: dict = Depends(get_admin_user)):
    result = supabase.table("hero_slides").delete().eq("id", slide_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Hero slide not found")
    return {"message": "Hero slide deleted"}

@api_router.get("/admin/users", response_model=List[User])
async def get_users(admin: dict = Depends(get_admin_user)):
    res = supabase.table("users").select("id,first_name,last_name,email,phone,role,is_active,created_at,picture,auth_provider").execute()
    return res.data

@api_router.put("/admin/users/{user_id}/toggle-active")
async def toggle_user_active(user_id: str, admin: dict = Depends(get_admin_user)):
    res = supabase.table("users").select("is_active").eq("id", user_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    user = res.data[0]
    
    new_status = not user.get("is_active", True)
    supabase.table("users").update({"is_active": new_status}).eq("id", user_id).execute()
    return {"message": f"User {'activated' if new_status else 'deactivated'}"}

@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(
    admin: dict = Depends(get_admin_user),
    status: str = None,
    search: str = None,
    start_date: str = None,
    end_date: str = None
):
    query = supabase.table("orders").select("*")
    
    if status:
        query = query.eq("status", status)
    
    if search:
        query = query.or_(f"id.ilike.%{search}%")
    
    if start_date:
        query = query.gte("created_at", start_date)
    if end_date:
        query = query.lte("created_at", end_date)
        
    res = query.order("created_at", desc=True).execute()
    return res.data

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(
    order_id: str, 
    background_tasks: BackgroundTasks, 
    data: dict = Body(...), 
    admin: dict = Depends(get_admin_user)
):
    status = data.get("status")
    tracking_id = data.get("tracking_id")
    carrier_name = data.get("carrier_name")
    
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    update_data = {"status": status}
    
    if tracking_id:
        update_data["tracking_id"] = tracking_id
    if carrier_name:
        update_data["carrier_name"] = carrier_name
    
    if status == "shipped":
        update_data["shipped_at"] = datetime.now(timezone.utc).isoformat()
    elif status == "delivered":
        update_data["delivered_at"] = datetime.now(timezone.utc).isoformat()
        update_data["return_expiry_date"] = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    
    result = supabase.table("orders").update(update_data).eq("id", order_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order = result.data[0]
    if status in ["confirmed", "shipped", "out_for_delivery", "delivered"]:
        extra_info = ""
        if tracking_id:
            extra_info = f"<p><strong>Tracking ID:</strong> {tracking_id}</p>"
            if carrier_name:
                extra_info += f"<p><strong>Carrier:</strong> {carrier_name}</p>"
        
        try:
            await notify_order_status(order, status, background_tasks, extra_info)
        except Exception as e:
            logger.error(f"Email notification failed safely: {e}")
    
    return {"message": "Order status updated"}

@api_router.get("/admin/dashboard")
async def get_dashboard_stats(admin: dict = Depends(get_admin_user)):
    users_res = supabase.table("users").select("id", count="exact").eq("role", UserRole.USER).execute()
    total_users = users_res.count
    
    orders_res = supabase.table("orders").select("id", count="exact").execute()
    total_orders = orders_res.count
    
    rev_res = supabase.table("orders").select("final_amount").execute()
    total_revenue = sum(o["final_amount"] for o in rev_res.data) if rev_res.data else 0
    
    recent_res = supabase.table("orders").select("*").order("created_at", desc=True).limit(10).execute()
    
    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "recent_orders": recent_res.data
    }

@api_router.get("/wishlist", response_model=Wishlist)
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    res = supabase.table("wishlists").select("*").eq("user_id", current_user["id"]).execute()
    
    if not res.data:
        wishlist_id = str(uuid.uuid4())
        wishlist = {
            "id": wishlist_id,
            "user_id": current_user["id"],
            "items": []
        }
        supabase.table("wishlists").insert(wishlist).execute()
        return Wishlist(**wishlist)
        
    return Wishlist(**res.data[0])

@api_router.post("/wishlist/add/{product_id}")
async def add_to_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    res = supabase.table("wishlists").select("*").eq("user_id", current_user["id"]).execute()
    
    if not res.data:
        wishlist_id = str(uuid.uuid4())
        wishlist = {
            "id": wishlist_id,
            "user_id": current_user["id"],
            "items": [{
                "product_id": product_id,
                "added_at": datetime.now(timezone.utc).isoformat()
            }]
        }
        supabase.table("wishlists").insert(wishlist).execute()
    else:
        wishlist = res.data[0]
        items = wishlist.get("items", [])
        if not any(item["product_id"] == product_id for item in items):
            items.append({
                "product_id": product_id,
                "added_at": datetime.now(timezone.utc).isoformat()
            })
            supabase.table("wishlists").update({
                "items": items
            }).eq("user_id", current_user["id"]).execute()
    
    return {"message": "Item added to wishlist"}

@api_router.delete("/wishlist/remove/{product_id}")
async def remove_from_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    res = supabase.table("wishlists").select("*").eq("user_id", current_user["id"]).execute()
    
    if res.data:
        wishlist = res.data[0]
        items = [item for item in wishlist.get("items", []) if item["product_id"] != product_id]
        supabase.table("wishlists").update({
            "items": items
        }).eq("user_id", current_user["id"]).execute()
        
    return {"message": "Item removed from wishlist"}

@api_router.get("/addresses", response_model=List[Address])
async def get_addresses(current_user: dict = Depends(get_current_user)):
    res = supabase.table("addresses").select("*").eq("user_id", current_user["id"]).execute()
    return res.data

@api_router.post("/addresses", response_model=Address)
async def create_address(address_data: AddressCreate, current_user: dict = Depends(get_current_user)):
    address_id = str(uuid.uuid4())
    
    if address_data.is_default:
        supabase.table("addresses").update({"is_default": False}).eq("user_id", current_user["id"]).execute()
    
    address_doc = {
        "id": address_id,
        "user_id": current_user["id"],
        **address_data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    supabase.table("addresses").insert(address_doc).execute()
    return Address(**address_doc)

@api_router.put("/addresses/{address_id}", response_model=Address)
async def update_address(address_id: str, address_data: AddressCreate, current_user: dict = Depends(get_current_user)):
    if address_data.is_default:
        supabase.table("addresses").update({"is_default": False}).eq("user_id", current_user["id"]).execute()
    
    result = supabase.table("addresses").update(address_data.model_dump()).eq("id", address_id).eq("user_id", current_user["id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Address not found")
    return Address(**result.data[0])

@api_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, current_user: dict = Depends(get_current_user)):
    result = supabase.table("addresses").delete().eq("id", address_id).eq("user_id", current_user["id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address deleted"}

@api_router.get("/products/{product_id}/similar", response_model=List[Product])
async def get_similar_products(product_id: str):
    res = supabase.table("products").select("*").eq("id", product_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Product not found")
    product = res.data[0]
    
    sim_res = supabase.table("products").select("*") \
        .eq("category_id", product["category_id"]) \
        .neq("id", product_id) \
        .eq("is_active", True) \
        .limit(4) \
        .execute()
    
    return sim_res.data

@api_router.get("/products/search/{query}", response_model=List[Product])
async def search_products(query: str):
    res = supabase.table("products").select("*") \
        .or_(f"name.ilike.%{query}%,description.ilike.%{query}%") \
        .eq("is_active", True) \
        .limit(20) \
        .execute()
    return res.data

@api_router.get("/admin/reviews", response_model=List[Review])
async def get_all_reviews(admin: dict = Depends(get_admin_user)):
    res = supabase.table("reviews").select("*").order("created_at", desc=True).execute()
    return res.data

@api_router.put("/admin/reviews/{review_id}/approve")
async def approve_review(review_id: str, admin: dict = Depends(get_admin_user)):
    result = supabase.table("reviews").update({
        "is_approved": True, 
        "approval_status": "approved"
    }).eq("id", review_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review approved"}

@api_router.delete("/admin/reviews/{review_id}")
async def delete_review(review_id: str, admin: dict = Depends(get_admin_user)):
    result = supabase.table("reviews").delete().eq("id", review_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"message": "Review deleted"}

@api_router.post("/orders/{order_id}/cancel-request")
async def request_order_cancellation(order_id: str, reason: str, current_user: dict = Depends(get_current_user)):
    res = supabase.table("orders").select("*").eq("id", order_id).eq("user_id", current_user["id"]).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")
    order = res.data[0]
    
    if order["status"] in ["shipped", "delivered"]:
        raise HTTPException(status_code=400, detail="Cannot cancel order after shipping")
    
    supabase.table("orders").update({
        "cancellation_requested": True,
        "cancellation_reason": reason
    }).eq("id", order_id).execute()
    
    return {"message": "Cancellation request submitted"}

@api_router.put("/admin/orders/{order_id}/approve-cancellation")
async def approve_cancellation(order_id: str, admin: dict = Depends(get_admin_user)):
    res = supabase.table("orders").select("*").eq("id", order_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")
    order = res.data[0]
    
    supabase.table("orders").update({
        "status": "cancelled",
        "refund_status": "initiated",
        "cancellation_requested": False
    }).eq("id", order_id).execute()
    
    for item in (order.get("items") or []):
        prod_res = supabase.table("products").select("stock").eq("id", item["product_id"]).execute()
        if prod_res.data:
            current_stock = prod_res.data[0].get("stock") or 0
            supabase.table("products").update({"stock": current_stock + item["quantity"]}).eq("id", item["product_id"]).execute()
    
    return {"message": "Cancellation approved, stock restored"}

# ==================== REVIEWS ====================

@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    res = supabase.table("reviews").select("*").eq("product_id", product_id).or_("is_approved.eq.true,approval_status.eq.approved").order("created_at", desc=True).execute()
    return res.data

@api_router.post("/products/{product_id}/reviews")
async def create_review(product_id: str, data: dict = Body(...), current_user: dict = Depends(get_current_user)):
    prod_res = supabase.table("products").select("*").eq("id", product_id).execute()
    if not prod_res.data:
        raise HTTPException(status_code=404, detail="Product not found")
    
    orders_res = supabase.table("orders").select("*").eq("user_id", current_user["id"]).eq("status", "delivered").execute()
    delivered_order = None
    
    for order in orders_res.data:
        for item in (order.get("items") or []):
            if item.get("product_id") == product_id:
                delivered_order = order
                break
        if delivered_order:
            break
            
    if not delivered_order:
        raise HTTPException(status_code=403, detail="You can only review products from delivered orders")
    
    existing_res = supabase.table("reviews").select("*").eq("product_id", product_id).eq("user_id", current_user["id"]).execute()
    if existing_res.data:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    rating = data.get("rating")
    comment = data.get("comment", "")
    review_images = data.get("review_images", [])
    
    if not rating or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    review_id = str(uuid.uuid4())
    review = {
        "id": review_id,
        "product_id": product_id,
        "user_id": current_user["id"],
        "user_name": f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip() or "Anonymous",
        "rating": rating,
        "review_text": comment,
        "review_images": review_images,
        "is_verified_purchase": True,
        "approval_status": "pending",
        "is_approved": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    supabase.table("reviews").insert(review).execute()
    supabase.table("orders").update({"rating_submitted": True}).eq("id", delivered_order["id"]).execute()
    
    approved_res = supabase.table("reviews").select("rating").eq("product_id", product_id).or_("is_approved.eq.true,approval_status.eq.approved").execute()
    approved_reviews = approved_res.data
    
    if approved_reviews:
        avg_rating = sum(r["rating"] for r in approved_reviews) / len(approved_reviews)
        supabase.table("products").update({
            "average_rating": round(avg_rating, 1),
            "review_count": len(approved_reviews)
        }).eq("id", product_id).execute()
    
    return {"message": "Review submitted for approval", "review_id": review_id}

@api_router.get("/users/can-review/{product_id}")
async def can_user_review(product_id: str, current_user: dict = Depends(get_current_user)):
    orders_res = supabase.table("orders").select("*").eq("user_id", current_user["id"]).eq("status", "delivered").execute()
    delivered_order = None
    
    for order in orders_res.data:
        for item in (order.get("items") or []):
            if item.get("product_id") == product_id:
                delivered_order = order
                break
        if delivered_order:
            break
            
    if not delivered_order:
        return {"can_review": False, "reason": "You haven't received this product yet"}
    
    existing_res = supabase.table("reviews").select("*").eq("product_id", product_id).eq("user_id", current_user["id"]).execute()
    if existing_res.data:
        return {"can_review": False, "reason": "You have already reviewed this product"}
    
    return {"can_review": True}

# ==================== RETURN SYSTEM ====================

@api_router.post("/orders/{order_id}/request-return")
async def request_return(order_id: str, data: dict = Body(...), current_user: dict = Depends(get_current_user)):
    res = supabase.table("orders").select("*").eq("id", order_id).eq("user_id", current_user["id"]).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")
    order = res.data[0]
    
    if order["status"] != "delivered":
        raise HTTPException(status_code=400, detail="Can only return delivered orders")
    
    if order.get("return_status") and order["return_status"] != "none":
        raise HTTPException(status_code=400, detail="Return already requested for this order")
    
    delivered_at = order.get("delivered_at")
    if delivered_at:
        # Safer timezone aware parsing
        delivered_date = datetime.fromisoformat(delivered_at.replace("Z", "+00:00")).astimezone(timezone.utc)
        expiry_date = delivered_date + timedelta(days=3)
        
        if datetime.now(timezone.utc) > expiry_date:
            raise HTTPException(status_code=400, detail="Return window has expired (3 days from delivery)")
    
    reason = data.get("reason")
    images = data.get("images", [])
    
    if not reason:
        raise HTTPException(status_code=400, detail="Return reason is required")
    
    supabase.table("orders").update({
        "return_status": "requested",
        "return_requested_at": datetime.now(timezone.utc).isoformat(),
        "return_reason": reason,
        "return_images": images,
        "return_expiry_date": (datetime.fromisoformat(delivered_at.replace("Z", "+00:00")).astimezone(timezone.utc) + timedelta(days=3)).isoformat() if delivered_at else None
    }).eq("id", order_id).execute()
    
    return {"message": "Return request submitted successfully"}

@api_router.get("/orders/{order_id}/return-eligibility")
async def check_return_eligibility(order_id: str, current_user: dict = Depends(get_current_user)):
    res = supabase.table("orders").select("*").eq("id", order_id).eq("user_id", current_user["id"]).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")
    order = res.data[0]
    
    if order["status"] != "delivered":
        return {"eligible": False, "reason": "Order not yet delivered"}
    
    if order.get("return_status") and order["return_status"] != "none":
        return {"eligible": False, "reason": f"Return already {order['return_status']}"}
    
    delivered_at = order.get("delivered_at")
    if delivered_at:
        # Safe timezone handling
        delivered_date = datetime.fromisoformat(delivered_at.replace("Z", "+00:00")).astimezone(timezone.utc)
        expiry_date = delivered_date + timedelta(days=3)
        
        if datetime.now(timezone.utc) > expiry_date:
            return {"eligible": False, "reason": "Return window expired"}
        
        remaining_hours = int((expiry_date - datetime.now(timezone.utc)).total_seconds() / 3600)
        return {"eligible": True, "expiry_date": expiry_date.isoformat(), "remaining_hours": remaining_hours}
    
    return {"eligible": True, "reason": "Delivery date not recorded"}

@api_router.put("/admin/orders/{order_id}/return-action")
async def handle_return_action(
    order_id: str, 
    background_tasks: BackgroundTasks, 
    data: dict = Body(...), 
    admin: dict = Depends(get_admin_user)
):
    action = data.get("action")
    
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    res = supabase.table("orders").select("*").eq("id", order_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")
    order = res.data[0]
    
    if order.get("return_status") != "requested":
        raise HTTPException(status_code=400, detail="No pending return request for this order")

    if order.get("refund_status") in ["refund_initiated", "refund_completed"]:
         return {"message": "Refund already processed", "refund_status": order.get("refund_status")}
    
    if action == "reject":
        supabase.table("orders").update({"return_status": "rejected"}).eq("id", order_id).execute()
        try:
            await notify_order_status(order, "return_rejected", background_tasks, "<p>Unfortunately, your return request could not be approved. Please contact our support team for more information.</p>")
        except Exception:
            pass
        return {"message": "Return request rejected"}
    
    payment_id = order.get("razorpay_payment_id") or order.get("payment_id")
    refund_id = None
    refund_status = "refund_initiated"
    
    if payment_id and order.get("payment_status") == "captured":
        try:
            refund = razorpay_client.payment.refund(payment_id, {
                "amount": int(float(order["final_amount"]) * 100),
                "speed": "normal",
                "notes": {"reason": "Return approved", "order_id": order_id}
            })
            refund_id = refund.get("id")
            refund_status = "refund_completed"
            logger.info(f"Refund initiated for order {order_id}: {refund_id}")
        except Exception as e:
            logger.error(f"Refund error for order {order_id}: {e}")
            refund_status = "refund_failed"
    else:
        if action == "approve" and order.get("payment_status") != "captured":
             logger.info(f"Order {order_id} approved for return but payment not captured or COD. Manual refund needed.")
             raise HTTPException(status_code=400, detail="Cannot auto-refund unpaid order")

    for item in (order.get("items") or []):
        prod_res = supabase.table("products").select("stock").eq("id", item["product_id"]).execute()
        if prod_res.data:
            current_stock = prod_res.data[0].get("stock") or 0
            supabase.table("products").update({"stock": current_stock + item["quantity"]}).eq("id", item["product_id"]).execute()
    
    supabase.table("orders").update({
        "return_status": "approved",
        "status": "returned",
        "refund_status": refund_status,
        "razorpay_refund_id": refund_id,
        "refunded_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", order_id).execute()
    
    res = supabase.table("orders").select("*").eq("id", order_id).execute()
    updated_order = res.data[0]
    extra_info = f"<p>Your refund of <strong>₹{order['final_amount']:.0f}</strong> has been initiated and will be credited within 5-7 business days.</p>"
    if refund_id:
        extra_info += f"<p><strong>Refund ID:</strong> {refund_id}</p>"
    
    try:
        await notify_order_status(updated_order, "return_approved", background_tasks, extra_info)
    except Exception:
        pass
    
    return {"message": "Return approved and refund initiated", "refund_id": refund_id, "refund_status": refund_status}

# ==================== SHIPROCKET INTEGRATION ====================

SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external"
SHIPROCKET_EMAIL = os.environ.get("SHIPROCKET_EMAIL", "")
SHIPROCKET_PASSWORD = os.environ.get("SHIPROCKET_PASSWORD", "")

async def get_shiprocket_token() -> str:
    res = supabase.table("shiprocket_tokens").select("*").eq("id", "main").execute()
    
    if res.data:
        token_doc = res.data[0]
        expires_at = token_doc.get("expires_at")
        if expires_at:
            expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) < expiry:
                return token_doc["token"]
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SHIPROCKET_BASE_URL}/auth/login",
                json={"email": SHIPROCKET_EMAIL, "password": SHIPROCKET_PASSWORD},
                timeout=15.0
            )
            response.raise_for_status()
            data = response.json()
            
            token = data.get("token")
            if not token:
                raise HTTPException(status_code=500, detail="Shiprocket authentication failed")
            
            expires_at = (datetime.now(timezone.utc) + timedelta(days=9)).isoformat()
            
            supabase.table("shiprocket_tokens").upsert({
                "id": "main",
                "token": token,
                "expires_at": expires_at
            }).execute()
            
            return token
    except Exception as e:
        logger.error(f"Shiprocket auth error: {e}")
        raise HTTPException(status_code=500, detail="Shiprocket authentication failed")

@api_router.post("/shiprocket/create-shipment")
async def create_shiprocket_shipment(order_id: str = Body(..., embed=True), admin: dict = Depends(get_admin_user)):
    res = supabase.table("orders").select("*").eq("id", order_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")
    order = res.data[0]
    
    token = await get_shiprocket_token()
    
    shipping_addr = order.get("shipping_address") or {}
    items = (order.get("items") or [])
    
    payload = {
        "order_id": order_id,
        "order_date": order.get("created_at", datetime.now(timezone.utc).isoformat()),
        "billing_customer_name": shipping_addr.get("full_name", "Customer"),
        "billing_last_name": "",
        "billing_address": shipping_addr.get("address", ""),
        "billing_city": shipping_addr.get("city", ""),
        "billing_pincode": shipping_addr.get("pincode", ""),
        "billing_state": shipping_addr.get("state", ""),
        "billing_country": "India",
        "billing_email": shipping_addr.get("email", "customer@example.com"),
        "billing_phone": shipping_addr.get("phone", "9999999999"),
        "shipping_is_billing": True,
        "order_items": [
            {
                "name": item.get("product_name", "Product"),
                "sku": item.get("product_id", "SKU"),
                "units": item.get("quantity", 1),
                "selling_price": item.get("price", 0),
            }
            for item in items
        ],
        "payment_method": "Prepaid",
        "sub_total": order.get("final_amount", 0),
        "length": 20,
        "breadth": 15,
        "height": 10,
        "weight": 0.5
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SHIPROCKET_BASE_URL}/orders/create/adhoc",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=payload,
                timeout=30.0
            )
            
            data = response.json()
            
            if response.status_code != 200 or not data.get("order_id"):
                error_msg = data.get("message", data.get("errors", "Unknown error"))
                raise HTTPException(status_code=400, detail=f"Shiprocket error: {error_msg}")
            
            shiprocket_order_id = str(data.get("order_id"))
            shipment_id = str(data.get("shipment_id"))
            
            supabase.table("orders").update({
                "shiprocket_order_id": shiprocket_order_id,
                "shiprocket_shipment_id": shipment_id,
                "status": "confirmed"
            }).eq("id", order_id).execute()
            
            return {
                "message": "Order created in Shiprocket",
                "shiprocket_order_id": shiprocket_order_id,
                "shipment_id": shipment_id
            }
            
    except httpx.HTTPError as e:
        logger.error(f"Shiprocket API error: {e}")
        raise HTTPException(status_code=500, detail=f"Shiprocket API error: {str(e)}")

@api_router.post("/shiprocket/assign-awb")
async def assign_shiprocket_awb(
    shipment_id: str = Body(...),
    courier_id: int = Body(None),
    background_tasks: BackgroundTasks = None,
    admin: dict = Depends(get_admin_user)
):
    token = await get_shiprocket_token()
    
    try:
        async with httpx.AsyncClient() as client:
            payload = {"shipment_id": shipment_id}
            if courier_id:
                payload["courier_id"] = courier_id
            
            response = await client.post(
                f"{SHIPROCKET_BASE_URL}/courier/assign/awb",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=payload,
                timeout=30.0
            )
            
            data = response.json()
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail=data.get("message", "AWB assignment failed"))
            
            awb_data = data.get("response", {}).get("data", {})
            awb_code = awb_data.get("awb_code") or data.get("awb_code")
            courier_name = awb_data.get("courier_name") or data.get("courier_name")
            
            supabase.table("orders").update({
                "awb_code": awb_code,
                "carrier_name": courier_name,
                "tracking_id": awb_code,
                "status": "shipped",
                "shipped_at": datetime.now(timezone.utc).isoformat()
            }).eq("shiprocket_shipment_id", shipment_id).execute()
            
            res = supabase.table("orders").select("*").eq("shiprocket_shipment_id", shipment_id).execute()
            if res.data:
                order = res.data[0]
                extra_info = f"<p><strong>Tracking ID:</strong> {awb_code}</p><p><strong>Carrier:</strong> {courier_name}</p>"
                try:
                    if background_tasks:
                        await notify_order_status(order, "shipped", background_tasks, extra_info)
                except Exception:
                    pass
            
            return {
                "message": "AWB assigned successfully",
                "awb_code": awb_code,
                "courier_name": courier_name
            }
            
    except httpx.HTTPError as e:
        logger.error(f"AWB assignment error: {e}")
        raise HTTPException(status_code=500, detail=f"AWB assignment failed: {str(e)}")

@api_router.get("/shiprocket/track/{awb_code}")
async def track_shiprocket_shipment(awb_code: str):
    res = supabase.table("orders").select("*").or_(f"awb_code.eq.{awb_code},tracking_id.eq.{awb_code}").execute()
    order = res.data[0] if res.data else None
    
    token = await get_shiprocket_token()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SHIPROCKET_BASE_URL}/courier/track/awb/{awb_code}",
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                timeout=15.0
            )
            
            data = response.json()
            tracking_data = data.get("tracking_data", {})
            shipment_track = tracking_data.get("shipment_track", [])
            current_status = tracking_data.get("shipment_status", 0)
            
            status_map = {
                0: "pending", 1: "picked_up", 2: "in_transit", 3: "in_transit",
                4: "out_for_delivery", 5: "out_for_delivery", 6: "delivered", 7: "delivered",
                8: "cancelled", 9: "rto_initiated", 10: "rto_delivered"
            }
            
            readable_status = status_map.get(current_status, "unknown")
            
            tracking_events = []
            for event in shipment_track:
                tracking_events.append({
                    "status": event.get("activity", ""),
                    "location": event.get("location", ""),
                    "timestamp": event.get("date", "")
                })
            
            return {
                "awb_code": awb_code,
                "carrier_name": order.get("carrier_name") if order else tracking_data.get("courier_name"),
                "current_status": readable_status,
                "etd": tracking_data.get("etd", ""),
                "tracking_events": tracking_events,
                "raw_status_code": current_status
            }
            
    except httpx.HTTPError as e:
        logger.error(f"Tracking error: {e}")
        if order:
            return {
                "awb_code": awb_code,
                "carrier_name": order.get("carrier_name"),
                "current_status": order.get("status"),
                "tracking_events": [],
                "note": "Live tracking temporarily unavailable"
            }
        raise HTTPException(status_code=500, detail="Tracking failed")

@api_router.get("/shiprocket/couriers")
async def get_available_couriers(
    pickup_pincode: str,
    delivery_pincode: str,
    weight: float = 0.5,
    cod: int = 0
):
    token = await get_shiprocket_token()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SHIPROCKET_BASE_URL}/courier/serviceability/",
                headers={"Authorization": f"Bearer {token}"},
                params={
                    "pickup_postcode": pickup_pincode,
                    "delivery_postcode": delivery_pincode,
                    "weight": weight,
                    "cod": cod
                },
                timeout=15.0
            )
            
            data = response.json()
            couriers = data.get("data", {}).get("available_courier_companies", [])
            
            return {
                "available_couriers": [
                    {
                        "courier_id": c.get("courier_company_id"),
                        "name": c.get("courier_name"),
                        "rate": c.get("rate"),
                        "etd": c.get("etd"),
                        "rating": c.get("rating")
                    }
                    for c in couriers
                ]
            }
            
    except httpx.HTTPError as e:
        logger.error(f"Courier check error: {e}")
        raise HTTPException(status_code=500, detail="Could not fetch couriers")

# ==================== ENHANCED ADMIN ENDPOINTS ====================

@api_router.put("/admin/orders/{order_id}/update-tracking")
async def update_order_tracking(order_id: str, data: dict = Body(...), admin: dict = Depends(get_admin_user)):
    tracking_id = data.get("tracking_id")
    carrier_name = data.get("carrier_name")
    awb_code = data.get("awb_code")
    
    update_data = {}
    if tracking_id:
        update_data["tracking_id"] = tracking_id
    if carrier_name:
        update_data["carrier_name"] = carrier_name
    if awb_code:
        update_data["awb_code"] = awb_code
    
    result = supabase.table("orders").update(update_data).eq("id", order_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Tracking details updated"}

@api_router.put("/admin/orders/{order_id}/mark-delivered")
async def mark_order_delivered(order_id: str, admin: dict = Depends(get_admin_user)):
    delivered_at = datetime.now(timezone.utc).isoformat()
    return_expiry = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    
    result = supabase.table("orders").update({
        "status": "delivered",
        "delivered_at": delivered_at,
        "return_expiry_date": return_expiry
    }).eq("id", order_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order marked as delivered", "return_expiry_date": return_expiry}

@api_router.get("/admin/returns")
async def get_all_returns(admin: dict = Depends(get_admin_user)):
    res = supabase.table("orders").select("*").in_("return_status", ["requested", "approved", "rejected"]).order("return_requested_at", desc=True).execute()
    return res.data

@api_router.put("/admin/reviews/{review_id}/action")
async def review_action(review_id: str, data: dict = Body(...), admin: dict = Depends(get_admin_user)):
    action = data.get("action")
    
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    
    is_approved = action == "approve"
    approval_status = "approved" if is_approved else "rejected"
    
    result = supabase.table("reviews").update({
        "is_approved": is_approved,
        "approval_status": approval_status
    }).eq("id", review_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Review not found")
    
    if is_approved:
        review = result.data[0]
        approved_res = supabase.table("reviews").select("rating").eq("product_id", review["product_id"]).or_("is_approved.eq.true,approval_status.eq.approved").execute()
        approved_reviews = approved_res.data
        
        if approved_reviews:
            avg_rating = sum(r["rating"] for r in approved_reviews) / len(approved_reviews)
            supabase.table("products").update({
                "average_rating": round(avg_rating, 1),
                "review_count": len(approved_reviews)
            }).eq("id", review["product_id"]).execute()
    
    return {"message": f"Review {approval_status}"}

# ==================== HEALTH & PUBLIC ENDPOINTS ====================

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/return-policy")
async def get_return_policy():
    res = supabase.table("site_settings").select("*").eq("id", "main").execute()
    
    policy = None
    if res.data:
        policy = res.data[0].get("return_policy")
    
    if not policy:
        policy = f"""
## Hampious Return Policy

We want you to be completely satisfied with your purchase. If you receive a damaged or defective product, we offer a **3-day return policy**.

### Eligibility
- Returns must be requested within **3 days of delivery**
- Only damaged or defective products are eligible
- Product must be unused and in original packaging

### How to Request a Return
1. Go to **My Orders** page
2. Find the delivered order
3. Click **Request Return**
4. Upload images of the damaged product
5. Provide a detailed reason for return

### Refund Process
- Once your return is approved, refund will be initiated automatically
- Refunds are processed within **5-7 business days**
- Amount will be credited to the original payment method

### Contact Us
For any questions, contact us at:
- Email: support@hampious.com
- Phone: {SUPPORT_PHONE}
- Hours: Mon-Sun, 10AM - 7PM
"""
    return {"policy": policy}

# ==================== PINCODE LOOKUP ====================

@api_router.get("/pincode/{pincode}")
async def lookup_pincode(pincode: str):
    if len(pincode) != 6 or not pincode.isdigit():
        raise HTTPException(status_code=400, detail="Invalid pincode format")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.postalpincode.in/pincode/{pincode}",
                timeout=10.0
            )
            data = response.json()
            
            if data and len(data) > 0 and data[0].get("Status") == "Success":
                post_office = data[0]["PostOffice"][0]
                return {
                    "success": True,
                    "city": post_office["District"],
                    "state": post_office["State"],
                    "country": post_office["Country"]
                }
            else:
                return {"success": False, "message": "Invalid pincode"}
    except Exception as e:
        logger.error(f"Pincode lookup error: {e}")
        return {"success": False, "message": "Could not fetch location"}

app.include_router(api_router)

# ==================== CORS CONFIG ====================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://hampious.com",
        "https://www.hampious.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_check():
    try:
        supabase.table("users").select("id").limit(1).execute()
        logger.info("Supabase connected")
    except Exception as e:
        logger.error(f"Supabase connection failed: {e}")