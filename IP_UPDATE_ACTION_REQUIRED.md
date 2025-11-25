# Frontend IP Update - Action Required

## Current Situation
- ✅ Updated `Frontend/app.json` with new IP `10.142.247.156:8000`
- ✅ Updated `Frontend/config/backendConfig.ts` with new IP `10.142.247.156:8000`
- ❌ App still connecting to old IP `10.72.243.156:8000` (cached config)

## Solution: Clear Expo Cache and Rebuild

### Option 1: Full Clean Restart (Recommended)

```powershell
# In Frontend folder
cd Frontend

# Kill the expo process
# Press Ctrl+C in the Expo terminal

# Clear Expo cache
rm -r .expo
rm -r node_modules/.cache
rm -r android/.gradle
rm -r ios/Pods

# Clear watchman cache (if using watchman)
watchman watch-del-all

# Clear npm cache for this project
npm cache clean --force

# Reinstall dependencies
npm install

# Start fresh
npx expo start --clear
```

### Option 2: Quick Cache Clear

```powershell
# In Frontend folder
cd Frontend

# Stop the expo server (Ctrl+C in terminal)

# Clear cache
npx expo start --clear
```

### Option 3: Using Expo CLI

```powershell
cd Frontend

# Clear all Expo cache
npx expo-cli@latest cache --mode=reset

# Start with clear cache
npx expo start --clear
```

## After Restarting Expo

1. **Close the Expo client on your device/emulator completely**
2. **Restart the Expo app**
3. **Scan the QR code again** to reconnect to the development server
4. **The app should now use the new IP** `10.142.247.156:8000`

## Verification Steps

After restarting, you should see these logs:
```
[Backend Config] Resolved backend URL: http://10.142.247.156:8000
[Backend Config] Source: app.config/env
[API Config] api baseURL (Prompt Processor): http://10.142.247.156:8000
```

## If Issues Persist

1. **Check app.json is saved correctly:**
   ```powershell
   Get-Content Frontend/app.json | findstr "backendUrl"
   # Should output: "backendUrl": "http://10.142.247.156:8000"
   ```

2. **Check backendConfig.ts is updated:**
   ```powershell
   Get-Content Frontend/config/backendConfig.ts | findstr "10.142"
   # Should show: http://10.142.247.156:8000
   ```

3. **Verify Python backend is running:**
   ```powershell
   # Test health endpoint
   curl http://10.142.247.156:8000/health
   # Should respond with success
   ```

4. **Check device can reach backend:**
   ```powershell
   # From device/emulator terminal
   ping 10.142.247.156
   ```

## Files Updated
- ✅ `Frontend/app.json` - backendUrl
- ✅ `Frontend/config/backendConfig.ts` - fallback IP
- ✅ `python_backend/orchestration/agent_dispatcher.py` - host IP
- ✅ `python_backend/generate_cert.py` - certificate CN

---

**Next Step:** Restart Expo with cache clear and rescan QR code on device/emulator
