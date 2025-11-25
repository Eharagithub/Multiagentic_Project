# Twilio SMS Service Setup Guide

This guide will help you set up Twilio SMS service for sending OTP codes to patients in the Multiagenetic Healthcare application.

## Why Twilio?

- **Free Trial**: $15.50 credit when you sign up (enough for ~1,000 SMS messages)
- **Reliable**: Industry-leading SMS delivery
- **Easy Integration**: Simple API with good documentation
- **Global Coverage**: Works in 180+ countries

## Step 1: Create a Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Click "Sign up for free"
3. Fill in your details:
   - Email address
   - Password
   - Phone number (for verification)
4. Verify your email and phone number

## Step 2: Get Your Twilio Credentials

After signing up, you'll be taken to the Twilio Console Dashboard:

1. **Account SID**: Found on the dashboard homepage (starts with `AC...`)
2. **Auth Token**: Click "Show" next to Auth Token (keep this secret!)
3. **Phone Number**: You'll get a free trial phone number automatically

### Where to Find Credentials:

- **Dashboard URL**: `https://console.twilio.com/`
- **Account SID**: Dashboard → Account Info → Account SID
- **Auth Token**: Dashboard → Account Info → Auth Token (click "Show")
- **Phone Number**: Dashboard → Phone Numbers → Manage → Active Numbers

## Step 3: Install Python Dependencies

Navigate to the `python_backend` directory and install the required packages:

```bash
cd python_backend
pip install twilio fastapi uvicorn
```

Or add to your `requirements.txt`:

```txt
twilio>=8.0.0
fastapi>=0.104.0
uvicorn>=0.24.0
```

## Step 4: Set Environment Variables

### Option A: Environment Variables (Recommended for Production)

**Windows (PowerShell):**
```powershell
$env:TWILIO_ACCOUNT_SID="your_account_sid_here"
$env:TWILIO_AUTH_TOKEN="your_auth_token_here"
$env:TWILIO_PHONE_NUMBER="+1234567890"  # Your Twilio phone number
```

**Windows (Command Prompt):**
```cmd
set TWILIO_ACCOUNT_SID=your_account_sid_here
set TWILIO_AUTH_TOKEN=your_auth_token_here
set TWILIO_PHONE_NUMBER=+1234567890
```

**Linux/Mac:**
```bash
export TWILIO_ACCOUNT_SID="your_account_sid_here"
export TWILIO_AUTH_TOKEN="your_auth_token_here"
export TWILIO_PHONE_NUMBER="+1234567890"
```

### Option B: Create a `.env` File (For Development)

Create a `.env` file in the `python_backend` directory:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

Then install `python-dotenv` and load it in your code:

```bash
pip install python-dotenv
```

Update `sms_service.py` to load from `.env`:

```python
from dotenv import load_dotenv
load_dotenv()
```

## Step 5: Run the SMS Service

### Option A: Run as Standalone Service

```bash
cd python_backend/services
uvicorn sms_api:app --host 0.0.0.0 --port 8006
```

### Option B: Integrate into Main Orchestration Agent

Add the SMS endpoint to your main FastAPI app:

```python
from services.sms_api import app as sms_app
from fastapi.mount import Mount

main_app.mount("/sms", sms_app)
```

## Step 6: Update Frontend Configuration

Update `Frontend/services/smsService.ts` with your backend URL:

```typescript
const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8006';
```

Or set the environment variable:

```bash
export EXPO_PUBLIC_BACKEND_URL="http://your-server-ip:8006"
```

## Step 7: Test the SMS Service

### Test via API:

```bash
curl -X POST http://localhost:8006/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+1234567890",
    "otp_code": "123456",
    "patient_name": "Test Patient"
  }'
```

### Test via Frontend:

1. Open the app
2. Go to Doctor Profile → Create Patient
3. Enter a patient with an existing NIC number
4. Enter a valid phone number (with country code, e.g., +1234567890)
5. Click "Create Patient"
6. Check the patient's phone for the OTP SMS

## Troubleshooting

### Issue: "Twilio credentials not found"

**Solution**: Make sure environment variables are set correctly:
```bash
echo $TWILIO_ACCOUNT_SID  # Linux/Mac
echo %TWILIO_ACCOUNT_SID%  # Windows CMD
```

### Issue: "Invalid phone number format"

**Solution**: Phone numbers must be in E.164 format:
- ✅ Correct: `+1234567890`, `+94123456789`
- ❌ Wrong: `1234567890`, `(123) 456-7890`

### Issue: "SMS not received"

**Solutions**:
1. Check Twilio Console → Logs → Messaging for errors
2. Verify your Twilio account has credits
3. For trial accounts, you can only send to verified phone numbers
4. Check phone number format (must include country code)

### Issue: "Demo mode" message

**Solution**: This means Twilio credentials are not configured. The app will still work but won't send real SMS. Set up Twilio credentials to enable real SMS sending.

## Twilio Trial Limitations

- **Verified Numbers Only**: Trial accounts can only send SMS to verified phone numbers
- **Free Credit**: $15.50 credit (approximately 1,000 SMS messages)
- **Upgrade**: To send to any number, upgrade your account

### How to Verify a Phone Number:

1. Go to Twilio Console → Phone Numbers → Verified Caller IDs
2. Click "Add a new Caller ID"
3. Enter the phone number
4. Verify via call or SMS

## Production Considerations

1. **Upgrade Account**: Upgrade from trial to paid account for production
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Error Handling**: Add retry logic for failed SMS sends
4. **Logging**: Log all SMS sends for audit purposes
5. **Security**: Never commit credentials to version control
6. **Cost Monitoring**: Set up billing alerts in Twilio Console

## Alternative Free SMS Services

If Twilio doesn't work for you, here are alternatives:

1. **TextLocal** (India): Free tier with limited messages
2. **AWS SNS**: Free tier includes 100 SMS/month
3. **Vonage (Nexmo)**: Free trial with credit
4. **MessageBird**: Free tier available

## Support

- **Twilio Docs**: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- **Twilio Support**: [https://support.twilio.com](https://support.twilio.com)
- **Python SDK**: [https://www.twilio.com/docs/libraries/python](https://www.twilio.com/docs/libraries/python)

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit your Twilio credentials to Git
- Use environment variables or secure secret management
- Rotate credentials if accidentally exposed
- Use `.gitignore` to exclude `.env` files

## Next Steps

1. ✅ Set up Twilio account
2. ✅ Configure environment variables
3. ✅ Test SMS sending
4. ✅ Verify OTP flow in the app
5. ✅ Deploy to production (upgrade Twilio account)

---

**Need Help?** Check the Twilio Console logs or contact support.

