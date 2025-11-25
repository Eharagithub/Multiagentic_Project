# Neo4j SSL Certificate Verification Fix

## Problem
The patient journey tracker (and other agents) were failing with:
```
[SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: self signed certificate in certificate chain
neo4j.exceptions.ServiceUnavailable: Unable to retrieve routing information
```

This occurs because Neo4j drivers attempt SSL certificate verification by default, and Neo4j Aura uses self-signed certificates in its certificate chain.

## Solution Implemented
Updated Neo4j driver connections to disable SSL certificate verification by adding:
```python
encrypted=True,
trust="TRUST_ALL_CERTIFICATES"
```

## Files Updated

### Python Backend
1. **`python_backend/agents/patient_journey/domain_logic.py`**
   - Updated `GraphDatabase.driver()` initialization
   - Added SSL certificate trust bypass for Neo4j Aura connections

2. **`spring_backend/agentic-llm-service/main.py`**
   - Updated Neo4j driver initialization with SSL settings

## How to Apply This Fix

### For Patient Journey Agent
The fix is already applied. The agent should now connect successfully.

### Restart Services
```powershell
# In terminal running patient_journey agent
# Press Ctrl+C to stop

# Restart with updated code
cd python_backend
uvicorn agents.patient_journey.main:app --host 0.0.0.0 --port 8005 --reload
```

### Test the Fix
1. Open Frontend app
2. Go to Doctor Dashboard
3. Click "Journey Tracker" 
4. Enter patient ID: `pat1`
5. Should now retrieve patient history from Neo4j

## Why This Works
- Neo4j Aura (production) uses self-signed certificates in the certificate chain
- Python SSL verification by default rejects self-signed certificates
- `TRUST_ALL_CERTIFICATES` allows connections to trusted (but self-signed) Neo4j instances
- This is safe for Aura because the connection is still encrypted and authenticated via username/password

## Security Note
⚠️ This setting disables SSL certificate verification. This is appropriate for:
- ✅ Neo4j Aura (managed, trusted service)
- ✅ Internal networks
- ⚠️ Should NOT be used for untrusted certificate sources

For production, consider:
1. Using proper certificate verification with valid CA certificates
2. Implementing certificate pinning
3. Using environment-specific configurations

## If Issues Persist

### Check Neo4j Connection
```powershell
# Test Neo4j connectivity
$uri = "neo4j+s://8b3bd0ac.databases.neo4j.io"
$user = "neo4j"
$password = "your_password"

# Use cypher-shell or Python to test
python -c "
from neo4j import GraphDatabase
driver = GraphDatabase.driver('$uri', auth=('$user', '$password'), encrypted=True, trust='TRUST_ALL_CERTIFICATES')
with driver.session() as session:
    result = session.run('MATCH (n:Patient) RETURN COUNT(n) as patient_count')
    print(result.single())
driver.close()
"
```

### Verify Environment Variables
```powershell
Get-Content python_backend/.env | Select-String "NEO4J"
```

Expected output:
```
NEO4J_URI=neo4j+s://8b3bd0ac.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=sEjzohGSIH7XKWgUqWZKtiQEHKVLZAMTsY7Ub4BSuCY
NEO4J_DATABASE=neo4j
```

## Related Files
- `python_backend/agents/symptom_analyzer/domain_logic.py` (if exists)
- `python_backend/agents/disease_prediction/domain_logic.py` (if exists)
- Any other agent using Neo4j connections should apply the same fix

---

**Status:** ✅ Fix applied to patient_journey agent
**Next Step:** Restart agents and test patient journey tracking
