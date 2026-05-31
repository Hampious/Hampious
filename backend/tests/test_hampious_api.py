"""
Hampious E-commerce API Tests
Tests for authentication, products, cart, checkout, and payment endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://premium-orders.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "Admin@123"
TEST_USER_EMAIL = f"test_user_{os.urandom(4).hex()}@test.com"
TEST_USER_PASSWORD = "Test@123"


class TestHealthAndBasicEndpoints:
    """Basic API health and public endpoint tests"""
    
    def test_get_categories(self):
        """Test GET /api/categories - public endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} categories")
    
    def test_get_products(self):
        """Test GET /api/products - public endpoint"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Should have at least one product"
        print(f"✓ Found {len(data)} products")
        
        # Verify product structure
        product = data[0]
        assert "id" in product
        assert "name" in product
        assert "price" in product
        assert "images" in product
    
    def test_get_products_with_filters(self):
        """Test GET /api/products with query parameters"""
        # Test sort by price ascending
        response = requests.get(f"{BASE_URL}/api/products?sort_by=price_asc")
        assert response.status_code == 200
        
        # Test sort by price descending
        response = requests.get(f"{BASE_URL}/api/products?sort_by=price_desc")
        assert response.status_code == 200
        
        # Test featured products
        response = requests.get(f"{BASE_URL}/api/products?featured=true")
        assert response.status_code == 200
        print("✓ Product filters working")
    
    def test_get_single_product(self):
        """Test GET /api/products/{product_id}"""
        # First get all products
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        
        if len(products) > 0:
            product_id = products[0]["id"]
            response = requests.get(f"{BASE_URL}/api/products/{product_id}")
            assert response.status_code == 200
            product = response.json()
            assert product["id"] == product_id
            print(f"✓ Single product fetch working: {product['name']}")
    
    def test_get_hero_slides(self):
        """Test GET /api/hero-slides - public endpoint"""
        response = requests.get(f"{BASE_URL}/api/hero-slides")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Found {len(data)} hero slides")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_signin_with_admin_credentials(self):
        """Test POST /api/auth/signin with admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"].upper() == "ADMIN"  # Case-insensitive check
        print(f"✓ Admin login successful: {data['user']['email']}")
    
    def test_signin_with_invalid_credentials(self):
        """Test POST /api/auth/signin with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected correctly")
    
    def test_signup_new_user(self):
        """Test POST /api/auth/signup"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "first_name": "Test",
            "last_name": "User",
            "email": TEST_USER_EMAIL,
            "phone": "+919876543210",
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_USER_EMAIL
        print(f"✓ New user signup successful: {TEST_USER_EMAIL}")
    
    def test_signup_duplicate_email(self):
        """Test POST /api/auth/signup with duplicate email"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "first_name": "Test",
            "last_name": "User",
            "email": ADMIN_EMAIL,  # Already exists
            "phone": "+919876543210",
            "password": "Test@123"
        })
        assert response.status_code == 400
        print("✓ Duplicate email rejected correctly")
    
    def test_get_current_user(self):
        """Test GET /api/auth/me"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get current user
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        user = response.json()
        assert user["email"] == ADMIN_EMAIL
        print(f"✓ Get current user working: {user['email']}")


class TestCartOperations:
    """Cart endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def product_id(self):
        """Get a product ID for testing"""
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        return products[0]["id"] if products else None
    
    def test_get_cart(self, auth_token):
        """Test GET /api/cart"""
        response = requests.get(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        cart = response.json()
        assert "items" in cart
        print(f"✓ Get cart working: {len(cart['items'])} items")
    
    def test_add_to_cart(self, auth_token, product_id):
        """Test POST /api/cart/add"""
        if not product_id:
            pytest.skip("No products available")
        
        # Get product price
        product_response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        product = product_response.json()
        price = product.get("discount_price") or product["price"]
        
        response = requests.post(
            f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "product_id": product_id,
                "quantity": 1,
                "price": price
            }
        )
        assert response.status_code == 200
        print(f"✓ Add to cart working: {product['name']}")
    
    def test_remove_from_cart(self, auth_token, product_id):
        """Test POST /api/cart/remove/{product_id}"""
        if not product_id:
            pytest.skip("No products available")
        
        response = requests.post(
            f"{BASE_URL}/api/cart/remove/{product_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        print("✓ Remove from cart working")
    
    def test_clear_cart(self, auth_token):
        """Test POST /api/cart/clear"""
        response = requests.post(
            f"{BASE_URL}/api/cart/clear",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify cart is empty
        cart_response = requests.get(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        cart = cart_response.json()
        assert len(cart["items"]) == 0
        print("✓ Clear cart working")


class TestCouponValidation:
    """Coupon validation tests"""
    
    def test_validate_invalid_coupon(self):
        """Test GET /api/coupons/validate/{code} with invalid code"""
        response = requests.get(f"{BASE_URL}/api/coupons/validate/INVALIDCODE?amount=1000")
        assert response.status_code == 404
        print("✓ Invalid coupon rejected correctly")


class TestPaymentIntegration:
    """Payment endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_create_razorpay_order(self, auth_token):
        """Test POST /api/payment/create-razorpay-order"""
        response = requests.post(
            f"{BASE_URL}/api/payment/create-razorpay-order",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=1999.0  # Amount in INR
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "amount" in data
        assert data["currency"] == "INR"
        print(f"✓ Razorpay order created: {data['id']}")


class TestOrderOperations:
    """Order endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_my_orders(self, auth_token):
        """Test GET /api/orders/my"""
        response = requests.get(
            f"{BASE_URL}/api/orders/my",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        orders = response.json()
        assert isinstance(orders, list)
        print(f"✓ Get my orders working: {len(orders)} orders")


class TestWishlistOperations:
    """Wishlist endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def product_id(self):
        """Get a product ID for testing"""
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        return products[0]["id"] if products else None
    
    def test_get_wishlist(self, auth_token):
        """Test GET /api/wishlist"""
        response = requests.get(
            f"{BASE_URL}/api/wishlist",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        wishlist = response.json()
        assert "items" in wishlist
        print(f"✓ Get wishlist working: {len(wishlist['items'])} items")
    
    def test_add_to_wishlist(self, auth_token, product_id):
        """Test POST /api/wishlist/add/{product_id}"""
        if not product_id:
            pytest.skip("No products available")
        
        response = requests.post(
            f"{BASE_URL}/api/wishlist/add/{product_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # May return 200 or 400 if already in wishlist
        assert response.status_code in [200, 400]
        print("✓ Add to wishlist endpoint working")


class TestAdminEndpoints:
    """Admin-only endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/signin", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_all_orders_admin(self, admin_token):
        """Test GET /api/admin/orders"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        orders = response.json()
        assert isinstance(orders, list)
        print(f"✓ Admin get all orders working: {len(orders)} orders")
    
    def test_get_all_users_admin(self, admin_token):
        """Test GET /api/admin/users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        users = response.json()
        assert isinstance(users, list)
        print(f"✓ Admin get all users working: {len(users)} users")
    
    def test_get_coupons_admin(self, admin_token):
        """Test GET /api/coupons (admin only)"""
        response = requests.get(
            f"{BASE_URL}/api/coupons",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        coupons = response.json()
        assert isinstance(coupons, list)
        print(f"✓ Admin get coupons working: {len(coupons)} coupons")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
