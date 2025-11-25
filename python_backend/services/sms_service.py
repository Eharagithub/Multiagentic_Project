"""
SMS Service for sending OTP codes to patients
Uses Webex Interact for SMS delivery (successor to TextLocal)
Supports international numbers including Sri Lanka
"""
import os
import logging
import requests
from typing import Optional

# Try to load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    # Load .env file from parent directory (python_backend)
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    load_dotenv(env_path)
except ImportError:
    # python-dotenv not installed, will use environment variables only
    pass

logger = logging.getLogger(__name__)

class SMSService:
    """Service for sending SMS messages via Webex Interact"""
    
    def __init__(self):
        # Get Webex Interact credentials from environment variables
        self.access_token = os.getenv('WEBEX_INTERACT_ACCESS_TOKEN')
        self.api_key = os.getenv('WEBEX_INTERACT_API_KEY')  # Alternative: API key instead of token
        
        # Remove quotes from .env values if present
        if self.access_token:
            self.access_token = self.access_token.strip('"\'')
        if self.api_key:
            self.api_key = self.api_key.strip('"\'')
        
        # Use access token if available, otherwise use API key
        self.auth_token = self.access_token or self.api_key
        
        # Webex Interact API endpoint
        self.api_url = "https://api.webexinteract.com/v1/messages"
        
        # Debug logging (don't log secrets, just presence)
        logger.info(f"Webex Interact config check - Access Token/API Key: {'Set' if self.auth_token else 'Not set'}")
        
        if not self.auth_token:
            logger.warning("Webex Interact access token/API key not found. SMS service will run in demo mode.")
            logger.info("To get an access token, sign up at https://webexinteract.com/")
            logger.info("Create an API project in Developers section to get your access token")
            logger.info("Trial account includes £4.90 credit (~100 messages)")
    
    def send_otp(self, phone_number: str, otp_code: str, patient_name: str = "Patient") -> dict:
        """
        Send OTP code via SMS to patient's phone number
        
        Args:
            phone_number: Patient's phone number (E.164 format: +1234567890)
            otp_code: 6-digit OTP code to send
            patient_name: Name of the patient (optional)
        
        Returns:
            dict with 'success' (bool) and 'message' (str)
        """
        if not phone_number:
            return {
                'success': False,
                'message': 'Phone number is required'
            }
        
        # Format phone number to E.164 format
        formatted_phone = self._format_phone_number(phone_number)
        if not formatted_phone:
            return {
                'success': False,
                'message': 'Invalid phone number format'
            }
        
        # Create SMS message
        message_body = f"Your verification code for Multiagenetic Healthcare is: {otp_code}. This code will expire in 10 minutes. Do not share this code with anyone."
        
        # If Webex Interact is not configured, return demo mode response
        if not self.auth_token:
            logger.info(f"[DEMO MODE] Would send SMS to {formatted_phone}: {message_body}")
            return {
                'success': True,
                'message': f'[DEMO] OTP code {otp_code} would be sent to {formatted_phone}',
                'demo_mode': True
            }
        
        # Send SMS via Webex Interact
        try:
            # Webex Interact API requires Bearer token authentication
            headers = {
                'Authorization': f'Bearer {self.auth_token}',
                'Content-Type': 'application/json'
            }
            
            # Prepare payload for Webex Interact API
            # Webex Interact expects phone number in E.164 format (with +)
            payload = {
                'to': formatted_phone,  # Phone number in E.164 format with +
                'message': message_body
            }
            
            logger.info(f"Attempting to send SMS to {formatted_phone} via Webex Interact")
            
            # Make API request
            response = requests.post(self.api_url, json=payload, headers=headers, timeout=10)
            
            # Check response
            if response.status_code in [200, 201]:
                try:
                    response_data = response.json()
                except ValueError:
                    # Response is not JSON
                    error_msg = f"Invalid JSON response: {response.text}"
                    logger.error(f"Webex Interact API error: {error_msg}")
                    return {
                        'success': False,
                        'message': error_msg
                    }
                
                # Check if message was sent successfully
                # Webex Interact typically returns message ID on success
                message_id = response_data.get('id') or response_data.get('message_id') or response_data.get('messageId')
                if message_id or response.status_code == 201:
                    logger.info(f"SMS sent successfully via Webex Interact. Response: {response_data}")
                    return {
                        'success': True,
                        'message': 'OTP sent successfully',
                        'message_sid': str(message_id) if message_id else '',
                        'demo_mode': False
                    }
                else:
                    error_msg = response_data.get('message', response_data.get('error', 'Failed to send SMS'))
                    logger.error(f"Webex Interact error: {error_msg}. Full response: {response_data}")
                    return {
                        'success': False,
                        'message': f"Webex Interact error: {error_msg}"
                    }
            else:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('message', error_data.get('error', f"HTTP {response.status_code}"))
                except ValueError:
                    error_msg = f"HTTP {response.status_code}: {response.text}"
                
                logger.error(f"Webex Interact API error: {error_msg}")
                return {
                    'success': False,
                    'message': f"Failed to send SMS: {error_msg}"
                }
        
        except requests.exceptions.Timeout:
            error_msg = "SMS service timeout. Please try again."
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg
            }
        except requests.exceptions.RequestException as e:
            error_msg = f"Network error sending SMS: {str(e)}"
            logger.error(error_msg)
            return {
                'success': False,
                'message': error_msg
            }
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            error_msg = f"Unexpected error sending SMS: {str(e)}"
            logger.error(f"{error_msg}\n{error_trace}")
            return {
                'success': False,
                'message': error_msg
            }
    
    def _format_phone_number(self, phone_number: str) -> Optional[str]:
        """
        Format phone number to E.164 format (with +)
        Webex Interact requires E.164 format with + prefix
        
        Args:
            phone_number: Phone number in various formats
        
        Returns:
            Formatted phone number in E.164 format (+countrycode+number) or None if invalid
        """
        if not phone_number:
            return None
            
        # Remove all non-digit characters except +
        cleaned = ''.join(c for c in phone_number if c.isdigit() or c == '+')
        
        # If it doesn't start with +, assume it's a local number
        if not cleaned.startswith('+'):
            # Handle Sri Lankan number format
            # If starts with 0, remove it (0774855204 -> 774855204)
            if cleaned.startswith('0') and len(cleaned) == 10:
                cleaned = cleaned[1:]  # Remove leading 0
            
            # If 9 digits (after removing 0), add +94
            if len(cleaned) == 9:
                cleaned = '+94' + cleaned
            # If 10 digits (without leading 0), add +94
            elif len(cleaned) == 10:
                cleaned = '+94' + cleaned
            else:
                logger.warning(f"Phone number format unclear: {phone_number} (cleaned: {cleaned}, length: {len(cleaned)})")
                return None
        
        logger.info(f"Formatted phone number: {phone_number} -> {cleaned}")
        return cleaned

# Global instance
sms_service = SMSService()

