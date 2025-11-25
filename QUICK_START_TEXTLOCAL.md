# Quick Start: TextLocal SMS Setup

## ✅ What Changed

- **Replaced Twilio with TextLocal** - Free tier: 100 SMS/day
- **Removed Twilio dependencies** - No more `twilio` package needed
- **Updated all SMS service code** - Now uses TextLocal API
- **Frontend unchanged** - No changes needed to React Native code

## 🚀 Quick Setup (5 minutes)

### 1. Sign Up for TextLocal (2 min)
1. Go to [https://www.textlocal.in/](https://www.textlocal.in/)
2. Click **"Sign Up"** and create a free account
3. Verify your email and mobile number

### 2. Get API Key (1 min)
1. Log in to TextLocal dashboard
2. Go to **"API"** → **"API Keys"**
3. Copy your API key

### 3. Update .env File (1 min)
Add to `python_backend/.env`:

```env
TEXTLOCAL_API_KEY=your_api_key_here
TEXTLOCAL_SENDER=TXTLCL
```

**Note**: Remove old Twilio variables if they exist:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_PHONE_NUMBER`

### 4. Install Dependencies (1 min)
```bash
cd python_backend
pip install -r requirements.txt
```

**Note**: `twilio` package is no longer needed and has been removed from `requirements.txt`.

### 5. Restart SMS Service
```bash
cd python_backend
python -m uvicorn services.sms_api:app --host 0.0.0.0 --port 8006 --reload
```

## ✅ Test It

### Health Check:
```bash
curl http://localhost:8006/health
```

Should show:
```json
{
  "status": "healthy",
  "service": "sms_api",
  "textlocal_configured": true,
  "provider": "TextLocal",
  "sender": "TXTLCL"
}
```

### Send Test SMS:
Create a patient in the app with a Sri Lankan phone number (e.g., `0774855204`).

## 📱 Phone Number Formats Supported

- `+94774855204` (E.164 format)
- `0774855204` (Sri Lankan local format)
- `774855204` (9 digits)

All formats are automatically converted to `+94774855204`.

## 🆓 Free Tier Limits

- **100 SMS per day** (resets at midnight IST)
- International numbers supported (including Sri Lanka)
- No credit card required
- Perfect for testing and small deployments

## 🐛 Troubleshooting

### "API key not found"
- Check `TEXTLOCAL_API_KEY` is in `.env` file
- Restart the SMS service after updating `.env`

### "Invalid API key"
- Verify API key in TextLocal dashboard
- Make sure no extra spaces/quotes in `.env`

### SMS not received
- Check phone number format
- Verify number is active
- Check TextLocal dashboard for delivery status

### Demo Mode
If API key is not set, the service runs in **demo mode**:
- OTP codes are generated and stored
- SMS are not sent (but app still works)
- Perfect for development/testing

## 📚 Full Documentation

See `TEXTLOCAL_SMS_SETUP.md` for detailed setup instructions.

## ✨ Benefits Over Twilio

- ✅ **100 free SMS/day** (vs Twilio's trial limitations)
- ✅ **No phone number verification needed** for recipients
- ✅ **Simpler setup** (just one API key)
- ✅ **Works with Sri Lankan numbers** out of the box
- ✅ **No credit card required** for free tier

---

**Ready to go!** Just add your TextLocal API key to `.env` and restart the service.

