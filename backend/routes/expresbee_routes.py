import os
import requests
import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/expresbee", tags=["expresbee"])

# ExpressBee Configuration
EXPRESBEE_API_KEY = os.getenv("EXPRESBEE_API_KEY", "")
EXPRESBEE_ACCOUNT_ID = os.getenv("EXPRESBEE_ACCOUNT_ID", "")
EXPRESBEE_BASE_URL = os.getenv("EXPRESBEE_BASE_URL", "https://api.expresbee.com")

logger = logging.getLogger(__name__)


# Request/Response Models
class ShipmentCreateRequest(BaseModel):
    order_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    delivery_address: str
    delivery_city: str
    delivery_state: str
    delivery_pincode: str
    delivery_country: str = "India"
    items_description: str
    items_weight: float = 0.5
    items_quantity: int = 1
    total_amount: float
    carrier_preference: Optional[str] = None


class TrackingResponse(BaseModel):
    status: str
    location: str
    last_update: str
    awb_number: str
    carrier_name: str


# Helper Functions
def get_headers():
    """Get headers for ExpressBee API requests"""
    return {
        "Authorization": f"Bearer {EXPRESBEE_API_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }


def create_expresbee_shipment(shipment_data: ShipmentCreateRequest):
    """
    Create a shipment in ExpressBee
    Returns: {success: bool, awb_number: str, tracking_id: str, carrier_name: str, error: str}
    """
    try:
        payload = {
            "order_id": shipment_data.order_id,
            "sender": {
                "name": "Hampious",
                "phone": "9876543210",  # Store in config
                "email": "info@hampious.com",  # Store in config
                "address": "Hampious Warehouse",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "country": "India"
            },
            "recipient": {
                "name": shipment_data.customer_name,
                "phone": shipment_data.customer_phone,
                "email": shipment_data.customer_email,
                "address": shipment_data.delivery_address,
                "city": shipment_data.delivery_city,
                "state": shipment_data.delivery_state,
                "pincode": shipment_data.delivery_pincode,
                "country": shipment_data.delivery_country
            },
            "shipment": {
                "length": 20,
                "width": 15,
                "height": 10,
                "weight": shipment_data.items_weight,
                "quantity": shipment_data.items_quantity,
                "description": shipment_data.items_description,
                "value": shipment_data.total_amount,
                "type": "parcel"
            },
            "service_type": shipment_data.carrier_preference or "standard"
        }

        response = requests.post(
            f"{EXPRESBEE_BASE_URL}/shipments",
            json=payload,
            headers=get_headers(),
            timeout=30
        )

        if response.status_code == 201:
            data = response.json()
            return {
                "success": True,
                "awb_number": data.get("awb_number", ""),
                "tracking_id": data.get("tracking_id", ""),
                "carrier_name": data.get("carrier_name", "ExpressBee"),
                "order_id": shipment_data.order_id
            }
        else:
            logger.error(f"ExpressBee shipment creation failed: {response.status_code} - {response.text}")
            return {
                "success": False,
                "error": f"Failed to create shipment: {response.status_code}",
                "order_id": shipment_data.order_id
            }

    except requests.exceptions.Timeout:
        logger.error("ExpressBee request timeout")
        return {"success": False, "error": "Request timeout", "order_id": shipment_data.order_id}
    except requests.exceptions.ConnectionError:
        logger.error("ExpressBee connection error")
        return {"success": False, "error": "Connection error", "order_id": shipment_data.order_id}
    except Exception as e:
        logger.error(f"ExpressBee shipment error: {str(e)}")
        return {"success": False, "error": str(e), "order_id": shipment_data.order_id}


def get_expresbee_tracking(awb_number: str):
    """
    Get tracking information from ExpressBee
    Returns: {success: bool, status: str, location: str, last_update: str, carrier_name: str, error: str}
    """
    try:
        response = requests.get(
            f"{EXPRESBEE_BASE_URL}/shipments/{awb_number}/track",
            headers=get_headers(),
            timeout=15
        )

        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "status": data.get("status", "In Transit"),
                "location": data.get("current_location", ""),
                "last_update": data.get("last_update", ""),
                "carrier_name": data.get("carrier_name", "ExpressBee"),
                "awb_number": awb_number
            }
        else:
            logger.warning(f"ExpressBee tracking not found: {awb_number}")
            return {
                "success": False,
                "error": f"Tracking not found",
                "awb_number": awb_number
            }

    except Exception as e:
        logger.error(f"ExpressBee tracking error: {str(e)}")
        return {"success": False, "error": str(e), "awb_number": awb_number}


def generate_expresbee_label(awb_number: str):
    """
    Generate AWB label PDF from ExpressBee
    Returns: {success: bool, label_url: str, error: str}
    """
    try:
        response = requests.get(
            f"{EXPRESBEE_BASE_URL}/shipments/{awb_number}/label",
            headers=get_headers(),
            timeout=15
        )

        if response.status_code == 200:
            return {
                "success": True,
                "label_url": response.url,
                "awb_number": awb_number
            }
        else:
            logger.warning(f"ExpressBee label generation failed: {awb_number}")
            return {
                "success": False,
                "error": "Label generation failed",
                "awb_number": awb_number
            }

    except Exception as e:
        logger.error(f"ExpressBee label error: {str(e)}")
        return {"success": False, "error": str(e), "awb_number": awb_number}


def get_expresbee_carriers():
    """
    Get available carriers from ExpressBee
    Returns: {success: bool, carriers: list, error: str}
    """
    try:
        response = requests.get(
            f"{EXPRESBEE_BASE_URL}/carriers",
            headers=get_headers(),
            timeout=15
        )

        if response.status_code == 200:
            data = response.json()
            carriers = data.get("carriers", [])
            return {
                "success": True,
                "carriers": [
                    {"name": c.get("name"), "service_type": c.get("service_type")}
                    for c in carriers
                ]
            }
        else:
            return {"success": False, "error": "Failed to fetch carriers", "carriers": []}

    except Exception as e:
        logger.error(f"ExpressBee carriers error: {str(e)}")
        return {"success": False, "error": str(e), "carriers": []}


# API Routes

@router.post("/create-shipment")
async def create_shipment(shipment: ShipmentCreateRequest):
    """Create a shipment in ExpressBee"""
    if not EXPRESBEE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ExpressBee API key not configured"
        )

    result = create_expresbee_shipment(shipment)

    if result["success"]:
        return {
            "success": True,
            "awb_number": result["awb_number"],
            "tracking_id": result["tracking_id"],
            "carrier_name": result["carrier_name"],
            "order_id": result["order_id"]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create shipment")
        )


@router.get("/track/{awb_number}")
async def get_tracking(awb_number: str):
    """Get tracking information for a shipment"""
    result = get_expresbee_tracking(awb_number)

    if result["success"]:
        return {
            "success": True,
            "status": result["status"],
            "location": result["location"],
            "last_update": result["last_update"],
            "carrier_name": result["carrier_name"],
            "awb_number": awb_number
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", "Tracking information not found")
        )


@router.get("/generate-label/{awb_number}")
async def generate_label(awb_number: str):
    """Generate AWB label for a shipment"""
    result = generate_expresbee_label(awb_number)

    if result["success"]:
        return {
            "success": True,
            "label_url": result["label_url"],
            "awb_number": awb_number
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to generate label")
        )


@router.get("/carriers")
async def get_carriers():
    """Get available carriers"""
    result = get_expresbee_carriers()

    if result["success"]:
        return {
            "success": True,
            "carriers": result["carriers"]
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Failed to fetch carriers")
        )
