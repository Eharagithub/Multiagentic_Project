# Fix: SMS Service Using Wrong Phone Number

## Problem
The SMS service is still using the old Twilio phone number (`+94774855204`) even though `.env` has been updated to `+18164276379`.

## Solution: Complete Service Restart

### Step 1: Stop the Service Completely
1. Go to the terminal where SMS service is running (port 8006)
2. Press `Ctrl+C` to stop it
3. Wait a few seconds to ensure it's fully stopped

### Step 2: Clear Python Cache (Optional but Recommended)
```powershell
cd C:\Upani\AI\Multiagenetic-Healthcare\python_backend
Remove-Item -Recurse -Force .\services\__pycache__ -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\__pycache__ -ErrorAction SilentlyContinue
```

### Step 3: Restart the Service
```powershell
cd C:\Upani\AI\Multiagenetic-Healthcare\python_backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn services.sms_api:app --host 0.0.0.0 --port 8006 --reload
```

### Step 4: Verify Configuration
Look for this in the startup logs:
```
Twilio config check - Account SID: Set, API Key: Set, Auth Token: Set, Phone Number: +18164276379
```

Or test the health endpoint:
```powershell
Invoke-RestMethod -Uri 'http://localhost:8006/health' -Method Get
```

Should show: `"twilio_phone_number": "+18164276379"`

## Why This Happens
- Python modules are cached when imported
- Environment variables are loaded at module import time
- The service instance is created once and reused
- Even with `--reload`, cached values might persist

## After Restart
Try creating a patient again. The service should now use the correct Twilio number.

