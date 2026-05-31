from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "USER"
    ADMIN = "ADMIN"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PAYMENT_CONFIRMED = "payment_confirmed"
    CONFIRMED = "confirmed"
    PACKED = "packed"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"
    REFUNDED = "refunded"

class ReturnStatus(str, Enum):
    NONE = "none"
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    REFUND_INITIATED = "refund_initiated"
    REFUND_COMPLETED = "refund_completed"

class ReviewApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    role: UserRole = UserRole.USER
    is_active: bool = True
    created_at: Optional[str] = None

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: str
    category_id: str
    price: float
    discount_price: Optional[float] = None
    stock: int
    # FIXED: Replaced [] with default_factory
    images: List[str] = Field(default_factory=list)
    is_active: bool = True
    featured: bool = False
    created_at: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    description: str
    category_id: str
    price: float
    discount_price: Optional[float] = None
    stock: int
    # FIXED: Replaced [] with default_factory
    images: List[str] = Field(default_factory=list)
    is_active: bool = True
    featured: bool = False

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    # FIXED: Replaced [] with default_factory
    items: List[CartItem] = Field(default_factory=list)
    updated_at: str

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    items: List[OrderItem]
    
    # Updated amount fields
    subtotal: float = 0
    total: float = 0
    discount_amount: float = 0
    final_amount: float
    
    shipping_address: dict
    payment_method: str
    payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    payment_status: Optional[str] = None
    paid_at: Optional[str] = None
    status: OrderStatus = OrderStatus.PENDING
    gift_options: Optional[dict] = None
    cancellation_requested: bool = False
    cancellation_reason: Optional[str] = None
    refund_status: Optional[str] = None
    # Shipping/Tracking fields
    tracking_id: Optional[str] = None
    carrier_name: Optional[str] = None
    awb_code: Optional[str] = None
    shiprocket_order_id: Optional[str] = None
    shipped_at: Optional[str] = None
    delivered_at: Optional[str] = None
    # Return fields
    return_status: ReturnStatus = ReturnStatus.NONE
    return_requested_at: Optional[str] = None
    return_expiry_date: Optional[str] = None
    return_reason: Optional[str] = None
    # FIXED: Replaced [] with default_factory
    return_images: List[str] = Field(default_factory=list)
    razorpay_refund_id: Optional[str] = None
    refunded_at: Optional[str] = None
    # Rating tracking
    rating_submitted: bool = False
    created_at: Optional[str] = None

class OrderCreate(BaseModel):
    items: List[OrderItem]
    
    subtotal: float = 0
    total: float = 0
    discount_amount: float = 0
    final_amount: float = 0
    
    # FIXED: Replaced {} with default_factory
    shipping_address: dict = Field(default_factory=dict)
    payment_method: str = "razorpay"
    coupon_code: Optional[str] = None

    razorpay_order_id: Optional[str] = None  # ✅ ADD THIS

class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    code: str
    discount_type: str
    discount_value: float
    min_purchase: float = 0
    max_discount: Optional[float] = None
    expiry_date: Optional[str] = None
    usage_limit: Optional[int] = None
    usage_count: int = 0
    is_active: bool = True
    created_at: Optional[str] = None

class CouponCreate(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    min_purchase: float = 0
    max_discount: Optional[float] = None
    expiry_date: Optional[str] = None
    usage_limit: Optional[int] = None

class HeroSlide(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    subtitle: Optional[str] = None
    image_url: str
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    is_active: bool = True
    order: int = 0
    created_at: Optional[str] = None

class HeroSlideCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_url: str
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    order: int = 0

class WishlistItem(BaseModel):
    product_id: str
    added_at: str

class Wishlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    # FIXED: Replaced [] with default_factory
    items: List[WishlistItem] = Field(default_factory=list)
    updated_at: str

class Address(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    full_name: str
    phone: str
    address_line: str
    city: str
    state: str
    country: str
    pincode: str
    is_default: bool = False
    created_at: Optional[str] = None

class AddressCreate(BaseModel):
    full_name: str
    phone: str
    address_line: str
    city: str
    state: str
    country: str
    pincode: str
    is_default: bool = False

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    review_text: str
    # FIXED: Replaced [] with default_factory
    review_images: List[str] = Field(default_factory=list)
    is_verified_purchase: bool = False
    approval_status: ReviewApprovalStatus = ReviewApprovalStatus.PENDING
    is_approved: bool = False  # Legacy field for backward compatibility
    created_at: Optional[str] = None

class ReviewCreate(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    review_text: str
    # FIXED: Replaced [] with default_factory
    review_images: List[str] = Field(default_factory=list)

class ReturnRequest(BaseModel):
    reason: str
    # FIXED: Replaced [] with default_factory
    images: List[str] = Field(default_factory=list)

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    session_token: str
    expires_at: str
    created_at: Optional[str] = None

class GiftOptions(BaseModel):
    gift_message: Optional[str] = None
    gift_wrap: bool = False
    preferred_delivery_date: Optional[str] = None