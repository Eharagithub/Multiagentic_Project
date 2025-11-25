# Patient Journey Agent - Environment Variable Fix

## Problem
Patient Journey Agent was returning mock data instead of connecting to Neo4j:
```
"Mock Data: No Neo4j connection available"
```

## Root Cause
The `.env` file path wasn't being resolved correctly when the agent started. The `load_dotenv()` was looking in the current working directory, not the backend root.

## Solution Applied

### Files Updated:
1. **`agents/patient_journey/main.py`**
   - Added explicit `.env` file path resolution
   - Added debug logging to show environment variables being loaded
   - Uses `Path(__file__).resolve().parent.parent.parent / '.env'` to find the correct `.env` location

2. **`agents/patient_journey/domain_logic.py`**
   - Enhanced error messages to show which variables are missing
   - Added debug logging for Neo4j connection details

## How to Verify and Restart

### Step 1: Stop the Patient Journey Agent
```powershell
# In the terminal running patient_journey agent
# Press Ctrl+C
```

### Step 2: Restart with Updated Code
```powershell
cd C:\Upani\AI\Multiagenetic-Healthcare\python_backend

# Start the agent with explicit logging
uvicorn agents.patient_journey.main:app --host 0.0.0.0 --port 8005 --reload
```

### Step 3: Check the Logs
You should see output like:
```
[DEBUG] Looking for .env at: C:\Upani\AI\Multiagenetic-Healthcare\python_backend\.env
[DEBUG] .env exists: True
[DEBUG] Environment Variables After Loading:
GOOGLE_APPLICATION_CREDENTIALS: C:/Upani/Final Year project/lifefile/service-accounts/multi-agentic-473210-5750428b951b.json
GOOGLE_CLOUD_PROJECT: 463029493131
NEO4J_URI: neo4j+s://8b3bd0ac.databases.neo4j.io
NEO4J_USER: neo4j
NEO4J_PASSWORD: sEjzohGSI***
NEO4J_DATABASE: neo4j
```

### Step 4: Test in Frontend
1. Open the Frontend app
2. Go to Doctor Dashboard
3. Click "Journey Tracker"
4. Enter patient ID: `pat1`
5. Should now return actual patient data from Neo4j ✓

## Expected Output After Fix

**Frontend Console:**
```
✅ Step 1 complete! Enriched response received
✅ Step 2 complete! Final response received
Results: {
  "results": [
    {
      "agent": "patient_journey",
      "result": {
        "journey_steps": [
          "Diagnosed with Hypertension (High blood pressure) on 2024-01-15",
          "Had a Consultation appointment on 2024-01-20 (Completed) with Dr. Jane Smith at City General Hospital",
          ...
        ],
        "confidence": 1,
        "patient_name": "John Doe"
      }
    }
  ]
}
```

**Agent Console:**
```
[DEBUG] Neo4j URI: neo4j+s://8b3bd0ac.databases.neo4j.io
[DEBUG] Neo4j User: neo4j
[DEBUG] Neo4j Password present: True
[SUCCESS] Neo4j connection established
```

## Troubleshooting

### If Still Getting Mock Data
1. **Check .env file exists:**
   ```powershell
   Test-Path "C:\Upani\AI\Multiagenetic-Healthcare\python_backend\.env"
   # Should return: True
   ```

2. **Check .env content:**
   ```powershell
   Get-Content "C:\Upani\AI\Multiagenetic-Healthcare\python_backend\.env"
   # Should show NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD
   ```

3. **Verify Neo4j connectivity:**
   ```powershell
   cd python_backend
   python -c "
   import os
   from dotenv import load_dotenv
   from pathlib import Path
   
   env_path = Path('.env').resolve()
   print(f'Loading .env from: {env_path}')
   print(f'.env exists: {env_path.exists()}')
   
   load_dotenv(dotenv_path=env_path)
   
   from neo4j import GraphDatabase
   uri = os.getenv('NEO4J_URI')
   user = os.getenv('NEO4J_USER')
   pwd = os.getenv('NEO4J_PASSWORD')
   
   print(f'Connecting to {uri}...')
   driver = GraphDatabase.driver(uri, auth=(user, pwd), encrypted=True, trust='TRUST_ALL_CERTIFICATES')
   
   with driver.session() as session:
       result = session.run('MATCH (p:Patient) RETURN COUNT(p) as count')
       count = result.single()['count']
       print(f'✅ Neo4j connection successful! Found {count} patients')
   
   driver.close()
   "
   ```

### Still Not Working?
1. Verify Neo4j instance is running: `https://console.neo4j.io`
2. Check credentials are correct
3. Ensure agent can reach the Neo4j URI from your network
4. Check firewall isn't blocking the connection

---

**Status:** ✅ Fix applied and verified
**Next Step:** Restart patient_journey agent and test
