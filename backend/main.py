import os
from pathlib import Path

# Load .env before anything else
try:
    from dotenv import load_dotenv
    # Try local .env first
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print(f"[startup] .env loaded from {env_path}")
    # Try Render secret file path
    render_secret = Path("/etc/secrets/.env.vercel")
    if render_secret.exists():
        load_dotenv(dotenv_path=render_secret, override=True)
        print(f"[startup] Render secret file loaded from {render_secret}")
except ImportError:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth_routes import router as auth_router
from routes.product_routes import router as product_router
from routes.order_routes import router as order_router
from routes.admin_routes import router as admin_router
from routes.expresbee_routes import router as expresbee_router
from routes.cart_routes import router as cart_router
from routes.payment_routes import router as payment_router
from routes.shiprocket_routes import router as shiprocket_router
from routes.coupon_routes import router as coupon_router

app = FastAPI()

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://hampious.com",
    "https://www.hampious.com",
    os.environ.get("VERCEL_URL", ""),
    os.environ.get("FRONTEND_URL", ""),
]
ALLOWED_ORIGINS = [o for o in ALLOWED_ORIGINS if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Keep * for now — tighten after deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth")
app.include_router(product_router, prefix="/api/products")
app.include_router(order_router, prefix="/api/orders")
app.include_router(admin_router, prefix="/api/admin")
app.include_router(cart_router, prefix="/api")
app.include_router(payment_router, prefix="/api")
app.include_router(shiprocket_router, prefix="/api")
app.include_router(coupon_router, prefix="/api")
app.include_router(expresbee_router)

@app.get("/")
def root():
    return {"status": "Backend running"}
