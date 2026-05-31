# Backend Setup Guide - Hampious

## Quick Start

### 1. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env` and update with your credentials:
```bash
cp .env.example .env
```

### 4. Run Backend Server
```bash
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## API Endpoints

- **Base URL:** `http://localhost:8000`
- **API Base:** `http://localhost:8000/api`

### Available Routes

1. **Authentication** - `/api/auth/`
   - `POST /api/auth/signup` - Sign up new user
   - `POST /api/auth/login` - Login user

2. **Products** - `/api/products/`
   - `GET /api/products/` - List all products
   - `GET /api/products/{id}` - Get product by ID
   - `GET /api/products/category/{category}` - Get products by category
   - `POST /api/products/` - Create new product

3. **Orders** - `/api/orders/`
   - `GET /api/orders/` - List all orders
   - `GET /api/orders/{id}` - Get order by ID
   - `POST /api/orders/` - Create new order
   - `PUT /api/orders/{id}` - Update order
   - `DELETE /api/orders/{id}` - Delete order

## Environment Variables

See `.env.example` for all available configuration options.

### Required for Production:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `JWT_SECRET_KEY` - Secret key for JWT tokens
- `STRIPE_SECRET_KEY` - Stripe API key
- `RAZORPAY_KEY_ID` - Razorpay API key

## Troubleshooting

**Port 8000 already in use?**
```bash
uvicorn main:app --reload --port 8001
```

**Virtual environment issues?**
```bash
# Delete and recreate
rmdir venv /s /q
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**ModuleNotFoundError?**
```bash
pip install -r requirements.txt --upgrade
```

## Testing

Run tests with:
```bash
pytest tests/
```

## Development

The server automatically reloads when you make changes due to `--reload` flag.

Keep the terminal running to see real-time logs and errors.
