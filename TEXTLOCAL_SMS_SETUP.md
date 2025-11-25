# TextLocal SMS Setup Guide

## Overview
This project uses **TextLocal** for sending OTP SMS messages. TextLocal offers:
- ✅ **100 free SMS per day** (free tier)
- ✅ Supports international numbers including Sri Lanka (+94)
- ✅ Simple API integration
- ✅ No credit card required for free tier

## Step 1: Sign Up for TextLocal

1. Go to [https://www.textlocal.in/](https://www.textlocal.in/)
2. Click **"Sign Up"** or **"Register"**
3. Fill in your details:
   - Email address
   - Password
   - Mobile number (for verification)
4. Verify your email and mobile number
5. Log in to your TextLocal account

## Step 2: Get Your API Key

1. After logging in, go to **"API"** section in the dashboard
2. Click on **"API Keys"** or **"Generate API Key"**
3. Copy your API key (it will look like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)
4. **Important**: Keep this API key secure and don't share it publicly

## Step 3: Configure Environment Variables

Add the following to your `python_backend/.env` file:

```env
# TextLocal SMS Configuration
TEXTLOCAL_API_KEY=your_api_key_here
TEXTLOCAL_SENDER=TXTLCL
```

### Environment Variables Explained:

- **`TEXTLOCAL_API_KEY`**: Your TextLocal API key (required)
- **`TEXTLOCAL_SENDER`**: Sender name (optional, default: "TXTLCL")
  - For free tier, you can use "TXTLCL" (TextLocal's default sender)
  - For paid accounts, you can use a custom 6-character sender name

### Example `.env` file:

```env
# TextLocal SMS Configuration
TEXTLOCAL_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
TEXTLOCAL_SENDER=TXTLCL
```

## Step 4: Install Dependencies

The required dependencies are already in `requirements.txt`. Make sure you have them installed:

```bash
cd python_backend
pip install -r requirements.txt
```

**Note**: The `twilio` package has been removed. You only need:
- `requests` (for HTTP API calls)
- `python-dotenv` (for loading .env file)
- `fastapi` and `uvicorn` (for the API server)

## Step 5: Start the SMS Service

```bash
cd python_backend
python -m uvicorn services.sms_api:app --host 0.0.0.0 --port 8006 --reload
```

The service will be available at: `http://localhost:8006`

## Step 6: Test the Service

### Health Check:
```bash
curl http://localhost:8006/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "sms_api",
  "textlocal_configured": true,
  "provider": "TextLocal",
  "sender": "TXTLCL"
}
```

### Send Test OTP:
```bash
curl -X POST http://localhost:8006/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+94774855204",
    "otp_code": "123456",
    "patient_name": "Test Patient"
  }'
```

## Phone Number Format

The service accepts phone numbers in various formats:
- `+94774855204` (E.164 format with +)
- `0774855204` (Sri Lankan local format with leading 0)
- `774855204` (9 digits without country code)

All formats will be automatically converted to `+94774855204` for TextLocal API.

## Free Tier Limits

- **100 SMS per day** (resets at midnight IST)
- International numbers supported (including Sri Lanka)
- No credit card required
- Sender name: "TXTLCL" (default)

## Troubleshooting

### Error: "API key not found"
- Make sure `TEXTLOCAL_API_KEY` is set in your `.env` file
- Restart the SMS service after updating `.env`

### Error: "Invalid API key"
- Verify your API key in the TextLocal dashboard
- Make sure there are no extra spaces or quotes in the `.env` file

### Error: "Daily limit exceeded"
- You've used all 100 free SMS for the day
- Wait until midnight IST for the limit to reset
- Or upgrade to a paid plan for more SMS

### SMS not received
- Check if the phone number is correct
- Verify the number is active and can receive SMS
- Check TextLocal dashboard for delivery status
- Some carriers may delay or block SMS messages

## Demo Mode

If the API key is not configured, the service will run in **demo mode**:
- OTP codes will be generated and stored in Firestore
- SMS will not be sent, but the app will continue to work
- Console logs will show `[DEMO MODE]` messages

This is useful for development and testing without consuming SMS credits.

## Support

- TextLocal Documentation: [https://www.textlocal.in/docs/](https://www.textlocal.in/docs/)
- TextLocal Support: Available in your dashboard
- API Status: Check [TextLocal Status Page](https://www.textlocal.in/status)

## Migration from Twilio

If you were previously using Twilio:
1. ✅ Remove `TWILIO_*` variables from `.env`
2. ✅ Add `TEXTLOCAL_API_KEY` to `.env`
3. ✅ Restart the SMS service
4. ✅ Test with a real phone number

The frontend code (`Frontend/services/smsService.ts`) doesn't need any changes - it just calls the backend API.

