"""
Shiprocket Integration for Hampious
Auth: API token (Bearer) — no login call needed.
Covers: create order → assign AWB → request pickup → track → cancel
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime
import requests as http
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────
SHIPROCKET_TOKEN = os.environ.get("SHIPROCKET_TOKEN", "xpe^7Ie1GkREgh$$ZH2a4p2CJX570eKT")
SHIPROCKET_EMAIL = os.environ.get("SHIPROCKET_EMAIL", "debashisbisoye12@gmail.com")
SHIPROCKET_BASE  = "https://apiv2.shiprocket.in/v1/external"

# Sender / pickup details — update to your warehouse address
SENDER = {
    "name":    "Hampious",
    "address": "Hampious Warehouse",
    "city":    "Mumbai",
    "state":   "Maharashtra",
    "pincode": "400001",
    "phone":   "9876543210",
}

# ── Auth helper ───────────────────────────────────────────────────────────────
_cached_token = {"token": SHIPROCKET_TOKEN, "expires": None}

def _get_token() -> str:
    """Return a valid Shiprocket Bearer token."""
    return _cached_token["token"]

def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_get_token()}",
        "Content-Type":  "application/json",
    }

def _api(method: str, path: str, **kwargs):
    """Make a Shiprocket API call; auto-refresh token on 401."""
    url = f"{SHIPROCKET_BASE}{path}"
    r = http.request(method, url, headers=_headers(), timeout=30, **kwargs)
    if r.status_code == 401:
        # Token expired — re-login
        try:
            login = http.post(f"{SHIPROCKET_BASE}/auth/login", json={
                "email": SHIPROCKET_EMAIL,
                "password": SHIPROCKET_TOKEN,
            }, timeout=15)
            if login.ok:
                _cached_token["token"] = login.json()["token"]
                r = http.request(method, url, headers=_headers(), timeout=30, **kwargs)
        except Exception as e:
            logger.error(f"[shiprocket] re-auth failed: {e}")
    return r

# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/shiprocket/create-order")
async def create_shiprocket_order(request: Request):
    """
    Create a Shiprocket order + auto-assign cheapest courier + request pickup.
    Body: { order } — the full admin order object.
    Returns: { shiprocket_order_id, shipment_id, awb_code, courier_name, label_url }
    """
    body = await request.json()
    order = body.get("order", body)

    addr     = order.get("shipping_address", {})
    items    = order.get("items", [])
    order_id = str(order.get("id", f"HAMP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"))

    # ── Build Shiprocket order payload ────────────────────────────────────────
    sr_items = []
    for item in items:
        sr_items.append({
            "name":          item.get("product_name") or item.get("name", "Gift Hamper"),
            "sku":           f"HAMP-{item.get('product_id', '001')}",
            "units":         int(item.get("quantity", 1)),
            "selling_price": float(item.get("price", 0)),
            "discount":      0,
            "tax":           0,
        })

    if not sr_items:
        sr_items = [{"name": "Gift Hamper", "sku": "HAMP-001", "units": 1, "selling_price": float(order.get("total", 0))}]

    customer_name  = addr.get("full_name") or order.get("customer_name", "Customer")
    name_parts     = customer_name.split(" ", 1)
    first_name     = name_parts[0]
    last_name      = name_parts[1] if len(name_parts) > 1 else "."

    payload = {
        "order_id":                  order_id,
        "order_date":                datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
        "pickup_location":           "Primary",
        "comment":                   "Hampious Gift Hamper",
        "billing_customer_name":     first_name,
        "billing_last_name":         last_name,
        "billing_address":           addr.get("address") or addr.get("line1", "NA"),
        "billing_address_2":         "",
        "billing_city":              addr.get("city", ""),
        "billing_pincode":           str(addr.get("pincode", "")),
        "billing_state":             addr.get("state", ""),
        "billing_country":           addr.get("country", "India"),
        "billing_email":             order.get("customer_email") or addr.get("email", ""),
        "billing_phone":             str(addr.get("phone") or order.get("customer_phone", "")),
        "shipping_is_billing":       True,
        "order_items":               sr_items,
        "payment_method":            "prepaid",
        "sub_total":                 float(order.get("total") or order.get("final_amount", 0)),
        "length":                    20,
        "breadth":                   15,
        "height":                    10,
        "weight":                    0.5,
    }

    # ── Step 1: Create order ──────────────────────────────────────────────────
    r = _api("POST", "/orders/create/adhoc", json=payload)
    if not r.ok:
        raise HTTPException(status_code=400, detail=f"Shiprocket order failed: {r.text}")

    data          = r.json()
    sr_order_id   = data.get("order_id")
    shipment_id   = data.get("shipment_id")

    if not shipment_id:
        raise HTTPException(status_code=400, detail="No shipment_id returned by Shiprocket")

    # ── Step 2: Auto-assign cheapest courier (AWB) ────────────────────────────
    awb_code    = None
    courier_name = "Shiprocket"
    label_url    = None

    awb_r = _api("POST", "/courier/assign/awb/shipment_id", json={
        "shipment_id": [shipment_id],
    })
    if awb_r.ok:
        awb_data     = awb_r.json().get("response", {}).get("data", {})
        awb_code     = awb_data.get("awb_code")
        courier_name = awb_data.get("courier_name", "Shiprocket")

        # ── Step 3: Request pickup ────────────────────────────────────────────
        _api("POST", "/courier/generate/pickup", json={"shipment_id": [shipment_id]})

        # ── Step 4: Get label URL ─────────────────────────────────────────────
        label_r = _api("POST", "/courier/generate/label", json={"shipment_id": [shipment_id]})
        if label_r.ok:
            label_url = label_r.json().get("label_url")

    return {
        "success":           True,
        "shiprocket_order_id": sr_order_id,
        "shipment_id":       shipment_id,
        "awb_code":          awb_code,
        "courier_name":      courier_name,
        "label_url":         label_url,
        "order_id":          order_id,
    }


@router.get("/shiprocket/track/{awb_code}")
async def track_shipment(awb_code: str):
    """Track a shipment by AWB code."""
    r = _api("GET", f"/courier/track/awb/{awb_code}")
    if not r.ok:
        raise HTTPException(status_code=404, detail="Tracking info not found")

    data     = r.json()
    tracking = data.get("tracking_data", {})
    shipment = tracking.get("shipment_track", [{}])[0] if tracking.get("shipment_track") else {}
    activities = tracking.get("shipment_track_activities", [])

    return {
        "success":       True,
        "awb_code":      awb_code,
        "status":        shipment.get("current_status", "In Transit"),
        "courier":       shipment.get("courier_name", ""),
        "eta":           shipment.get("etd", ""),
        "origin":        shipment.get("origin", ""),
        "destination":   shipment.get("destination", ""),
        "activities":    [
            {
                "date":     a.get("date", ""),
                "activity": a.get("activity", ""),
                "location": a.get("location", ""),
            }
            for a in activities[:10]
        ],
    }


@router.get("/shiprocket/couriers")
async def get_couriers():
    """Return available Shiprocket courier partners."""
    r = _api("GET", "/courier/serviceability/")
    if not r.ok:
        # Return defaults if API fails
        return {"success": True, "couriers": [
            {"id": "1", "name": "Delhivery"},
            {"id": "2", "name": "BlueDart"},
            {"id": "3", "name": "DTDC"},
            {"id": "12", "name": "Xpressbees"},
            {"id": "14", "name": "Ekart"},
        ]}
    data = r.json()
    couriers = data.get("data", {}).get("available_courier_companies", [])
    return {
        "success":  True,
        "couriers": [{"id": str(c.get("id")), "name": c.get("courier_name")} for c in couriers],
    }


@router.post("/shiprocket/cancel/{shiprocket_order_id}")
async def cancel_shipment(shiprocket_order_id: str):
    """Cancel a Shiprocket order."""
    r = _api("POST", "/orders/cancel", json={"ids": [int(shiprocket_order_id)]})
    if not r.ok:
        raise HTTPException(status_code=400, detail=f"Cancel failed: {r.text}")
    return {"success": True, "message": "Shipment cancelled"}


@router.get("/shiprocket/label/{shipment_id}")
async def get_label(shipment_id: str):
    """Get shipping label URL for a shipment."""
    r = _api("POST", "/courier/generate/label", json={"shipment_id": [int(shipment_id)]})
    if not r.ok:
        raise HTTPException(status_code=400, detail="Label generation failed")
    return {"success": True, "label_url": r.json().get("label_url")}
