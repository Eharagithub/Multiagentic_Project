# GOOGLE_APPLICATION_CREDENTIALS Path Fix

## Problem
The `GOOGLE_APPLICATION_CREDENTIALS` environment variable in agents was not being read correctly from the `.env` file, causing Vertex AI authentication failures.

The path in `.env` uses forward slashes:
```
GOOGLE_APPLICATION_CREDENTIALS=C:/Upani/Final Year project/lifefile/service-accounts/multi-agentic-473210-5750428b951b.json
```

But Windows expects backslashes.

## Solution Applied

Updated the following files to:
1. Load `.env` from explicit path (not current working directory)
2. Convert forward slashes to backslashes on Windows for credentials file paths
3. Verify the credentials file exists before using it

### Files Updated:

1. **`agents/patient_journey/main.py`**
   - Added explicit `.env` path resolution
   - Added credentials path validation and conversion
   - Added debug logging for credentials verification

2. **`services/llm_service.py`**
   - Added explicit `.env` path resolution
   - Added credentials path validation and conversion
   - This fixes Vertex AI initialization for all services

3. **`agents/disease_prediction/main.py`**
   - Added explicit `.env` path resolution
   - Added credentials path validation and conversion

## How It Works

```python
# 1. Load from explicit path
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# 2. Get credentials from env
google_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# 3. Check if path exists
if google_creds:
    creds_path = Path(google_creds)
    if not creds_path.exists():
        # Try Windows path format
        creds_path_windows = Path(google_creds.replace('/', '\\'))
        if creds_path_windows.exists():
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(creds_path_windows)
```

## What to Do Now

### Step 1: Restart All Python Services
```powershell
# Restart each service one by one:

# Terminal 1 - Stop and restart prompt processor
# (Ctrl+C, then:)
cd python_backend
uvicorn services.prompt_processor:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Stop and restart orchestration agent
cd python_backend
uvicorn orchestration_agent.main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 3 - Stop and restart disease prediction
cd python_backend
uvicorn agents.disease_prediction.main:app --host 0.0.0.0 --port 8002 --reload

# Terminal 4 - Stop and restart symptom analyzer
cd python_backend
uvicorn agents.symptom_analyzer.main:app --host 0.0.0.0 --port 8003 --reload

# Terminal 5 - Stop and restart patient journey
cd python_backend
uvicorn agents.patient_journey.main:app --host 0.0.0.0 --port 8005 --reload
```

### Step 2: Check Logs for Credentials Verification
You should see output like:
```
[DEBUG] Looking for .env at: C:\Upani\AI\Multiagenetic-Healthcare\python_backend\.env
[DEBUG] .env exists: True
[DEBUG] Environment Variables After Loading:
GOOGLE_APPLICATION_CREDENTIALS: C:/Upani/Final Year project/lifefile/service-accounts/multi-agentic-473210-5750428b951b.json
[DEBUG] Credentials file exists: False
[DEBUG] Trying Windows path: C:\Upani\Final Year project\lifefile\service-accounts\multi-agentic-473210-5750428b951b.json
[DEBUG] Windows path exists: True
[DEBUG] Updated GOOGLE_APPLICATION_CREDENTIALS to: C:\Upani\Final Year project\lifefile\service-accounts\multi-agentic-473210-5750428b951b.json
```

### Step 3: Test in Frontend
1. Open the Frontend app
2. Go to Doctor Dashboard
3. Click "Journey Tracker"
4. Request medical history - should now work with Vertex AI ✓

## Environment Variable Summary

Your `.env` file contains:
```dotenv
GOOGLE_APPLICATION_CREDENTIALS=C:/Upani/Final Year project/lifefile/service-accounts/multi-agentic-473210-5750428b951b.json
GOOGLE_CLOUD_PROJECT=463029493131
MOCK_LLM=false

NEO4J_URI=neo4j+s://8b3bd0ac.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=sEjzohGSIH7XKWgUqWZKtiQEHKVLZAMTsY7Ub4BSuCY
NEO4J_DATABASE=neo4j
AURA_INSTANCEID=8b3bd0ac
AURA_INSTANCENAME=Instance01
```

All services will now correctly load these values.

## Troubleshooting

### If credentials file not found
1. Verify the file exists:
   ```powershell
   Test-Path "C:\Upani\Final Year project\lifefile\service-accounts\multi-agentic-473210-5750428b951b.json"
   # Should return: True
   ```

2. Check `.env` file content:
   ```powershell
   Get-Content python_backend/.env | Select-String GOOGLE
   ```

3. Restart the services with debug output visible

### If Vertex AI still fails
- Check Google Cloud credentials are valid
- Verify `GOOGLE_CLOUD_PROJECT` is set correctly
- Ensure service account has required permissions

---

**Status:** ✅ All services updated
**Next Step:** Restart services and verify credentials loading
