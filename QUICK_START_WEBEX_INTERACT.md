# Quick Start: Webex Interact SMS Setup

## ✅ What Changed

- **Replaced TextLocal with Webex Interact** - TextLocal's successor platform
- **Updated all SMS service code** - Now uses Webex Interact API
- **Frontend unchanged** - No changes needed to React Native code

## 🚀 Quick Setup (5 minutes)

### 1. Sign Up for Webex Interact (2 min)
1. Go to [https://webexinteract.com/](https://webexinteract.com/)
2. Click **"Sign Up"** and create a free account
3. Verify your email address

### 2. Get Access Token (1 min)
1. Log in to Webex Interact dashboard
2. Go to **"Developers"** → **"API Projects"**
3. Create a new API project
4. Copy your **Access Token**

### 3. Update .env File (1 min)
Add to `python_backend/.env`:

```env
WEBEX_INTERACT_ACCESS_TOKEN=your_access_token_here
```

**Note**: Remove old TextLocal variables if they exist:
- `TEXTLOCAL_API_KEY`
- `TEXTLOCAL_SENDER`

### 4. Restart SMS Service
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
  "webex_interact_configured": true,
  "provider": "Webex Interact"
}
```

### Send Test SMS:
Create a patient in the app with a Sri Lankan phone number (e.g., `07748555204`).

## 📱 Phone Number Formats Supported

- `+94774855204` (E.164 format)
- `07748555204` (Sri Lankan local format)
- `774855204` (9 digits)

All formats are automatically converted to `+94774855204`.

## 💰 Pricing

- **Trial Account**: £4.90 credit included (~100 messages)
- **Pay-as-you-go**: Only pay for messages you send
- **No contracts**: No monthly fees
- **International SMS**: Check dashboard for Sri Lanka rates

## 🐛 Troubleshooting

### "Access token not found"
- Check `WEBEX_INTERACT_ACCESS_TOKEN` is in `.env` file
- Restart the SMS service after updating `.env`

### "Invalid access token"
- Verify access token in Webex Interact dashboard
- Make sure no extra spaces/quotes in `.env`

### "Insufficient credits"
- Check account balance in dashboard
- Top up if needed (trial includes £4.90)

### SMS not received
- Check phone number format
- Verify number is active
- Check Webex Interact dashboard for delivery status
- Contact support to enable international SMS if needed

### Demo Mode
If access token is not set, the service runs in **demo mode**:
- OTP codes are generated and stored
- SMS are not sent (but app still works)
- Perfect for development/testing

## 📚 Full Documentation

See `WEBEX_INTERACT_SMS_SETUP.md` for detailed setup instructions.

## ✨ Why Webex Interact?

- ✅ **TextLocal's Successor** - Official replacement platform
- ✅ **Trial Credit** - £4.90 free credit (~100 messages)
- ✅ **Pay-as-you-go** - No contracts, only pay for what you use
- ✅ **International Support** - Works with Sri Lankan numbers
- ✅ **Modern API** - Better documentation and features
- ✅ **Active Development** - Continued support and updates

---

**Ready to go!** Just add your Webex Interact access token to `.env` and restart the service.

