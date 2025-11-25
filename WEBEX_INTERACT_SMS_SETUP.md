# Webex Interact SMS Setup Guide

## Overview
This project uses **Webex Interact** for sending OTP SMS messages. Webex Interact is the successor to TextLocal and offers:
- ✅ **Trial account with £4.90 credit** (~100 messages)
- ✅ Supports international numbers including Sri Lanka
- ✅ Simple API integration
- ✅ Pay-as-you-go pricing (no contracts)
- ✅ Easy migration from TextLocal

## Step 1: Sign Up for Webex Interact

1. Go to [https://webexinteract.com/](https://webexinteract.com/)
2. Click **"Sign Up"** or **"Get Started"**
3. Fill in your details:
   - Email address
   - Password
   - Company name (optional)
4. Verify your email address
5. Log in to your Webex Interact account

## Step 2: Get Your Access Token

1. After logging in, go to **"Developers"** section in the dashboard
2. Click on **"API Projects"** or **"Create API Project"**
3. Create a new API project:
   - Give it a name (e.g., "Healthcare OTP Service")
   - Select the permissions you need (SMS sending)
4. Copy your **Access Token** (it will look like: `Bearer abc123def456...`)
   - **Important**: The token may include "Bearer " prefix - you can include it or not, the code handles both
   - Keep this token secure and don't share it publicly

## Step 3: Configure Environment Variables

Add the following to your `python_backend/.env` file:

```env
# Webex Interact SMS Configuration
WEBEX_INTERACT_ACCESS_TOKEN=your_access_token_here
```

**OR** if you have an API Key instead:

```env
# Webex Interact SMS Configuration (Alternative)
WEBEX_INTERACT_API_KEY=your_api_key_here
```

### Environment Variables Explained:

- **`WEBEX_INTERACT_ACCESS_TOKEN`**: Your Webex Interact access token (recommended)
- **`WEBEX_INTERACT_API_KEY`**: Alternative API key (if you prefer this method)

**Note**: The code will use the access token if available, otherwise it will use the API key.

### Example `.env` file:

```env
# Webex Interact SMS Configuration
WEBEX_INTERACT_ACCESS_TOKEN=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

## Step 4: Install Dependencies

The required dependencies are already in `requirements.txt`. Make sure you have them installed:

```bash
cd python_backend
pip install -r requirements.txt
```

**Required packages**:
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
  "webex_interact_configured": true,
  "provider": "Webex Interact"
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
- `07748555204` (Sri Lankan local format with leading 0)
- `774855204` (9 digits without country code)

All formats will be automatically converted to `+94774855204` for Webex Interact API.

## Pricing

- **Trial Account**: £4.90 credit included (~100 messages)
- **Pay-as-you-go**: Only pay for messages you send
- **No contracts**: No monthly fees or commitments
- **International SMS**: Pricing varies by country (check dashboard for Sri Lanka rates)

## Troubleshooting

### Error: "Access token not found"
- Make sure `WEBEX_INTERACT_ACCESS_TOKEN` is set in your `.env` file
- Restart the SMS service after updating `.env`

### Error: "Invalid access token" or "Unauthorized"
- Verify your access token in the Webex Interact dashboard
- Make sure there are no extra spaces or quotes in the `.env` file
- Check if the token has expired (create a new one if needed)

### Error: "Insufficient credits"
- Check your account balance in the Webex Interact dashboard
- Top up your account if needed
- Trial account includes £4.90 credit

### SMS not received
- Check if the phone number is correct and in E.164 format
- Verify the number is active and can receive SMS
- Check Webex Interact dashboard for delivery status
- Some carriers may delay or block SMS messages
- Verify international SMS is enabled in your account

### Error: "International SMS not enabled"
- Contact Webex Interact support to enable international SMS
- Check account settings for international messaging options

## Demo Mode

If the access token is not configured, the service will run in **demo mode**:
- OTP codes will be generated and stored in Firestore
- SMS will not be sent, but the app will continue to work
- Console logs will show `[DEMO MODE]` messages

This is useful for development and testing without consuming SMS credits.

## Migration from TextLocal

If you were previously using TextLocal:
1. ✅ Sign up for Webex Interact (free migration available)
2. ✅ Create an API project to get your access token
3. ✅ Replace `TEXTLOCAL_API_KEY` with `WEBEX_INTERACT_ACCESS_TOKEN` in `.env`
4. ✅ Remove old TextLocal variables from `.env`
5. ✅ Restart the SMS service
6. ✅ Test with a real phone number

**Note**: Webex Interact may offer credit transfer from your old TextLocal account. Contact support for details.

## API Documentation

- **Webex Interact API Docs**: [https://docs.webexinteract.com/](https://docs.webexinteract.com/)
- **API Authentication**: [https://docs.webexinteract.com/docs/api-authentication](https://docs.webexinteract.com/docs/api-authentication)
- **Send SMS API**: Check the API documentation for the exact endpoint format

## Support

- **Webex Interact Support**: Available in your dashboard
- **Email Support**: Check the support section in your dashboard
- **Documentation**: [https://docs.webexinteract.com/](https://docs.webexinteract.com/)

## Benefits Over TextLocal

- ✅ **Active Service**: Webex Interact is the active platform (TextLocal is being decommissioned)
- ✅ **Better Features**: Enhanced dashboard, reporting, and analytics
- ✅ **Modern API**: Updated API with better documentation
- ✅ **Reliable**: Continued support and development
- ✅ **Easy Migration**: Seamless transition from TextLocal

---

**Ready to go!** Just add your Webex Interact access token to `.env` and restart the service.

