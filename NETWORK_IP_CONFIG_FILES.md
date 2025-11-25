# Network IP Configuration Files - Quick Reference

**Current Network IP:** `10.142.247.156`

## Files to Update When Changing Network IP Address

Update these files whenever you need to change your network IP address:

### 1. **Frontend Configuration**
   - **File:** `Frontend/app.json`
   - **Field:** `expo.extra.backendUrl`
   - **Format:** `http://<NEW_IP>:8000`
   - **Purpose:** Tells the React Native app where to find the Python backend services

### 2. **Python Backend - Agent Dispatcher**
   - **File:** `python_backend/orchestration/agent_dispatcher.py`
   - **Field:** `host` variable in `__init__()` method (line ~17)
   - **Format:** `"<NEW_IP>"` (without protocol)
   - **Purpose:** Routes requests to microservices on the network

### 3. **Python Backend - Certificate Generation**
   - **File:** `python_backend/generate_cert.py`
   - **Field:** `cert.get_subject().CN`
   - **Format:** `"<NEW_IP>"`
   - **Purpose:** SSL certificate Common Name for secure connections

---

## Backend Service Ports (Reference)

These ports should be accessible on your network IP:

| Service | Port | File/Command |
|---------|------|--------------|
| Prompt Processor | 8000 | `uvicorn services.prompt_processor:app --host 0.0.0.0 --port 8000` |
| Orchestration Agent | 8001 | `uvicorn orchestration_agent.main:app --host 0.0.0.0 --port 8001` |
| Disease Prediction | 8002 | `uvicorn agents.disease_prediction.main:app --host 0.0.0.0 --port 8002` |
| Symptom Analyzer | 8003 | `uvicorn agents.symptom_analyzer.main:app --host 0.0.0.0 --port 8003` |
| Spring Boot Backend | 8080 | `mvn spring-boot:run` |

---

## Quick Update Steps

1. **Find your new network IP:**
   ```powershell
   # On Windows
   ipconfig /all
   # Look for "IPv4 Address" on your active network adapter
   ```

2. **Update the 3 files listed above** with the new IP address

3. **Restart all services:**
   - Stop all uvicorn/mvn processes
   - Restart with updated config

4. **Test connectivity:**
   ```
   Ping your machine from device/emulator:
   ping 10.142.247.156
   
   Test endpoint:
   http://10.142.247.156:8000/health
   ```

---

## Network Connectivity Checklist

- [ ] Machine's network IP is correct
- [ ] Frontend has updated IP in `app.json`
- [ ] Agent dispatcher has updated IP
- [ ] SSL certificate regenerated (if using HTTPS)
- [ ] All backend services running and accessible
- [ ] Firewall allows traffic on ports 8000-8003, 8080
- [ ] Device/Emulator on same network as backend
- [ ] Test health endpoint responds

---

## Troubleshooting

**Error: Network Error / Cannot reach backend**
1. Verify correct IP: `ipconfig /all`
2. Check firewall allows the ports
3. Verify services are running: `netstat -ano | findstr :8000`
4. Test from device: `ping <IP_ADDRESS>`
5. Verify device is on same network

**Error: Certificate issues**
- Regenerate SSL certificate by running `generate_cert.py` with updated IP
- Update `CN` field in certificate to match new IP

---

## File Summary Table

| # | File Path | Field to Update | Current Value |
|---|-----------|-----------------|----------------|
| 1 | `Frontend/app.json` | `expo.extra.backendUrl` | `http://10.142.247.156:8000` |
| 2 | `python_backend/orchestration/agent_dispatcher.py` | `host` variable | `10.142.247.156` |
| 3 | `python_backend/generate_cert.py` | `cert.get_subject().CN` | `10.142.247.156` |

---

**Last Updated:** 2025-11-23
**Total Files to Update:** 3
