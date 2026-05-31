from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth_routes import router as auth_router
from routes.product_routes import router as product_router
from routes.order_routes import router as order_router
from routes.admin_routes import router as admin_router
from routes.expresbee_routes import router as expresbee_router
from routes.cart_routes import router as cart_router
from routes.payment_routes import router as payment_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
app.include_router(expresbee_router)

@app.get("/")
def root():
    return {"status": "Backend running"}
