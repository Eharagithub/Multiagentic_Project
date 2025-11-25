# Quick Start: SMS OTP Setup

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (1 min)
```bash
cd python_backend
pip install twilio fastapi uvicorn python-dotenv
```

### Step 2: Get Twilio Credentials (2 min)
1. Sign up at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Get your credentials from the Twilio Console:
   - Account SID (starts with `AC...`)
   - Auth Token (click "Show")
   - Phone Number (auto-assigned)

### Step 3: Set Environment Variables (1 min)

**Windows:**
```powershell
$env:TWILIO_ACCOUNT_SID="your_account_sid"
$env:TWILIO_AUTH_TOKEN="your_auth_token"
$env:TWILIO_PHONE_NUMBER="+1234567890"
```

**Linux/Mac:**
```bash
export TWILIO_ACCOUNT_SID="your_account_sid"
export TWILIO_AUTH_TOKEN="your_auth_token"
export TWILIO_PHONE_NUMBER="+1234567890"
```

### Step 4: Run SMS Service (30 sec)
```bash
cd python_backend/services
uvicorn sms_api:app --host 0.0.0.0 --port 8006
```

### Step 5: Test It! (30 sec)
1. Open your app
2. Go to Doctor Profile → Create Patient
3. Enter a patient with existing NIC
4. Enter phone number (with country code: +1234567890)
5. Click "Create Patient"
6. Check the phone for OTP SMS! 📱

## ✅ That's It!

The system is now ready. When a doctor creates a patient with an existing NIC:
- OTP code is generated
- SMS is sent to patient's phone
- Doctor can verify OTP in doctorHome.tsx
- After verification, navigates to patientDashboard.tsx

## 🎯 Demo Mode

If you skip Twilio setup, the app runs in **demo mode**:
- OTP codes still work
- SMS is simulated (logged to console)
- Perfect for testing without Twilio

## 📚 Need More Details?

- **Full Setup Guide**: See `TWILIO_SMS_SETUP_GUIDE.md`
- **Implementation Details**: See `SMS_OTP_IMPLEMENTATION_SUMMARY.md`

## 🆘 Troubleshooting

**SMS not sending?**
- Check Twilio credentials are set: `echo $TWILIO_ACCOUNT_SID`
- Verify phone format: Must include country code (+1234567890)
- For trial accounts: Verify recipient phone in Twilio Console

**Service not starting?**
- Check port 8006 is available
- Verify dependencies installed: `pip list | grep twilio`

---

**Ready to go!** 🎉

