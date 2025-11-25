# Quick Guide: Adding Webex Interact Access Token

## Steps:

1. **Copy your access token** from Webex Interact dashboard:
   - Go to Developers → API Projects → healthApp
   - Click the copy icon next to your "Production token"
   - The token starts with `aky_`

2. **Add to `.env` file** in `python_backend/` folder:
   ```env
   WEBEX_INTERACT_ACCESS_TOKEN=aky_your_full_token_here
   ```
   
   **Important**: 
   - No quotes needed around the token
   - No spaces before or after the `=`
   - Use the full token (it's long)

3. **Restart the SMS service**:
   ```bash
   cd python_backend
   python -m uvicorn services.sms_api:app --host 0.0.0.0 --port 8006 --reload
   ```

4. **Test it**:
   ```bash
   curl http://localhost:8006/health
   ```
   
   Should show: `"webex_interact_configured": true`

## That's it! Your SMS service is ready to use.

