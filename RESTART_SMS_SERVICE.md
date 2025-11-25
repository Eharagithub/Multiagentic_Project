# How to Restart SMS Service

## The Issue
The SMS service is still using old environment variables from when it first started. You need to restart it to load the new `.env` values.

## Steps to Restart

### 1. Stop the Current Service
In the terminal where the SMS service is running:
- Press `Ctrl+C` to stop it

### 2. Restart the Service
```powershell
cd C:\Upani\AI\Multiagenetic-Healthcare\python_backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn services.sms_api:app --host 0.0.0.0 --port 8006 --reload
```

### 3. Verify It's Running
You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8006
INFO:     Application startup complete.
```

### 4. Check the Logs
Look for this line in the startup logs:
```
Twilio config check - Account SID: Set, API Key: Set, Auth Token: Set, Phone Number: +18164276379
```

This confirms it's using the correct Twilio phone number.

## Why This Happens
- Environment variables are loaded when the service starts
- Changing `.env` doesn't automatically update running services
- You must restart to reload the new values

## After Restart
Try creating a patient again. The error should be resolved if:
- ✅ TWILIO_PHONE_NUMBER is set to +18164276379
- ✅ Patient's phone number is different (not +18164276379)
- ✅ Service has been restarted

