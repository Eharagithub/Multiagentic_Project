"""
Standalone SMS API endpoint for sending OTP codes
Can be integrated into the main orchestration agent or run separately
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging
import sys
import os

# Add parent directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Import sms_service - try multiple import strategies
try:
    # First try: absolute import from services package
    from services.sms_service import sms_service
except ImportError:
    try:
        # Second try: relative import (same directory)
        from .sms_service import sms_service
    except ImportError:
        # Third try: direct import from current directory
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "sms_service", 
            os.path.join(current_dir, "sms_service.py")
        )
        sms_service_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(sms_service_module)
        sms_service = sms_service_module.sms_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="SMS Service API")

# Enable CORS
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SendOTPRequest(BaseModel):
    phone_number: str
    otp_code: str
    patient_name: Optional[str] = "Patient"

class SendOTPResponse(BaseModel):
    success: bool
    message: str
    demo_mode: Optional[bool] = False
    message_sid: Optional[str] = None

@app.post("/send-otp", response_model=SendOTPResponse)
async def send_otp(request: SendOTPRequest):
    """
    Send OTP code via SMS to patient's phone number
    
    Args:
        request: SendOTPRequest with phone_number, otp_code, and optional patient_name
    
    Returns:
        SendOTPResponse with success status and message
    """
    try:
        logger.info(f"Received OTP request for phone: {request.phone_number}, code: {request.otp_code[:2]}**")
        
        # Validate input
        if not request.phone_number:
            raise HTTPException(status_code=400, detail="Phone number is required")
        if not request.otp_code:
            raise HTTPException(status_code=400, detail="OTP code is required")
        
        result = sms_service.send_otp(
            phone_number=request.phone_number,
            otp_code=request.otp_code,
            patient_name=request.patient_name or "Patient"
        )
        
        logger.info(f"OTP send result: success={result.get('success')}, demo_mode={result.get('demo_mode')}")
        
        if result.get('success'):
            return SendOTPResponse(
                success=True,
                message=result.get('message', 'OTP sent successfully'),
                demo_mode=result.get('demo_mode', False),
                message_sid=result.get('message_sid')
            )
        else:
            error_msg = result.get('message', 'Unknown error')
            logger.error(f"OTP send failed: {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Error in send_otp endpoint: {str(e)}\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "sms_api",
        "webex_interact_configured": sms_service.auth_token is not None,
        "provider": "Webex Interact"
    }

@app.get("/debug")
async def debug_info():
    """Debug endpoint to check configuration"""
    return {
        "access_token_set": bool(sms_service.access_token),
        "api_key_set": bool(sms_service.api_key),
        "auth_token_set": bool(sms_service.auth_token),
        "provider": "Webex Interact",
        "api_url": sms_service.api_url
    }

