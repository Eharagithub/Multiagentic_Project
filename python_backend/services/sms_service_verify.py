"""
SMS Service using Twilio Verify for OTP codes
This is the recommended approach as Twilio Verify handles OTP generation and verification automatically
"""
import os
import logging
from typing import Optional, Dict
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)

class SMSVerifyService:
    """Service for sending and verifying OTP codes via Twilio Verify"""
    
    def __init__(self):
        # Get Twilio credentials from environment variables
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.verify_service_sid = os.getenv('TWILIO_VERIFY_SERVICE_SID')
        
        # Initialize Twilio client if credentials are available
        self.client = None
        if self.account_sid and self.auth_token:
            try:
                self.client = Client(self.account_sid, self.auth_token)
                logger.info("Twilio Verify service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
                self.client = None
        else:
            logger.warning("Twilio credentials not found. SMS service will run in demo mode.")
    
    def send_otp(self, phone_number: str, patient_name: str = "Patient") -> Dict:
        """
        Send OTP code via Twilio Verify to patient's phone number
        Twilio Verify automatically generates and sends the OTP
        
        Args:
            phone_number: Patient's phone number (E.164 format: +1234567890)
            patient_name: Name of the patient (optional)
        
        Returns:
            dict with 'success' (bool), 'message' (str), and 'sid' (str) if successful
        """
        if not phone_number:
            return {
                'success': False,
                'message': 'Phone number is required'
            }
        
        # Format phone number to E.164 format if needed
        formatted_phone = self._format_phone_number(phone_number)
        if not formatted_phone:
            return {
                'success': False,
                'message': 'Invalid phone number format'
            }
        
        # If Twilio is not configured, return demo mode response
        if not self.client or not self.verify_service_sid:
            # Generate a demo OTP code
            demo_otp = f"{os.urandom(3).hex()[:6]}"
            logger.info(f"[DEMO MODE] Would send OTP to {formatted_phone} via Twilio Verify")
            return {
                'success': True,
                'message': f'[DEMO] OTP would be sent to {formatted_phone}',
                'demo_mode': True,
                'demo_otp': demo_otp  # For testing purposes only
            }
        
        # Send OTP via Twilio Verify
        try:
            verification = self.client.verify \
                .v2 \
                .services(self.verify_service_sid) \
                .verifications \
                .create(to=formatted_phone, channel='sms')
            
            logger.info(f"OTP sent via Twilio Verify. SID: {verification.sid}, To: {formatted_phone}")
            return {
                'success': True,
                'message': 'OTP sent successfully via Twilio Verify',
                'sid': verification.sid,
                'status': verification.status,
                'demo_mode': False
            }
        
        except TwilioRestException as e:
            error_msg = f"Twilio error: {e.msg}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg
            }
        except Exception as e:
            error_msg = f"Unexpected error sending OTP: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg
            }
    
    def verify_otp(self, phone_number: str, otp_code: str) -> Dict:
        """
        Verify OTP code using Twilio Verify
        
        Args:
            phone_number: Patient's phone number (E.164 format)
            otp_code: OTP code entered by user
        
        Returns:
            dict with 'success' (bool), 'message' (str), and 'status' (str)
        """
        if not phone_number or not otp_code:
            return {
                'success': False,
                'message': 'Phone number and OTP code are required'
            }
        
        formatted_phone = self._format_phone_number(phone_number)
        if not formatted_phone:
            return {
                'success': False,
                'message': 'Invalid phone number format'
            }
        
        # If Twilio is not configured, return demo mode response
        if not self.client or not self.verify_service_sid:
            logger.info(f"[DEMO MODE] Would verify OTP for {formatted_phone}")
            return {
                'success': True,
                'message': '[DEMO] OTP verification skipped',
                'status': 'approved',
                'demo_mode': True
            }
        
        # Verify OTP via Twilio Verify
        try:
            verification_check = self.client.verify \
                .v2 \
                .services(self.verify_service_sid) \
                .verification_checks \
                .create(to=formatted_phone, code=otp_code)
            
            is_valid = verification_check.status == 'approved'
            
            logger.info(f"OTP verification result: {verification_check.status} for {formatted_phone}")
            return {
                'success': is_valid,
                'message': 'OTP verified successfully' if is_valid else 'Invalid OTP code',
                'status': verification_check.status,
                'demo_mode': False
            }
        
        except TwilioRestException as e:
            error_msg = f"Twilio verification error: {e.msg}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg
            }
        except Exception as e:
            error_msg = f"Unexpected error verifying OTP: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg
            }
    
    def _format_phone_number(self, phone_number: str) -> Optional[str]:
        """
        Format phone number to E.164 format required by Twilio
        
        Args:
            phone_number: Phone number in various formats
        
        Returns:
            Formatted phone number in E.164 format or None if invalid
        """
        # Remove all non-digit characters except +
        cleaned = ''.join(c for c in phone_number if c.isdigit() or c == '+')
        
        # If it doesn't start with +, assume it's a local number
        # For Sri Lankan numbers (10 digits), add +94
        if not cleaned.startswith('+'):
            if len(cleaned) == 10:
                # Sri Lankan number format
                cleaned = '+94' + cleaned
            elif len(cleaned) == 9:
                # Sri Lankan number without leading 0
                cleaned = '+94' + cleaned
            else:
                logger.warning(f"Phone number format unclear: {phone_number}")
                return None
        
        return cleaned

# Global instance
sms_verify_service = SMSVerifyService()

