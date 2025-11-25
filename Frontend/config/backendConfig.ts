// Centralized backend configuration for the Frontend.
// Resolution order (matching ExpoFE):
// 1. Expo config extra.backendUrl (from app.json)
// 2. process.env.BACKEND_BASE_URL (build-time env)
// 3. Default to LAN IP address
import Constants from 'expo-constants';

function envBackendUrl(): string | undefined {
  try {
    // expoConfig (app.json/app.config) -> extra.backendUrl
    const extras: any = (Constants && (Constants.expoConfig || (Constants.manifest && Constants.manifest.extra))) || {};
    if (extras && extras.backendUrl) return extras.backendUrl;
  } catch {
    // ignore
  }
  if (process && process.env && process.env.BACKEND_BASE_URL) return process.env.BACKEND_BASE_URL;
  return undefined;
}

// Resolution: app.json config > env var > LAN IP fallback
// Base URL defaults to Prompt Processor (port 8000)
// app.json can override to point to Orchestrator (8001) for simplified flow
const resolvedUrl = envBackendUrl() || 'http://10.251.177.156:8000';
console.log('[Backend Config] Resolved backend URL:', resolvedUrl);
console.log('[Backend Config] Source:', envBackendUrl() ? 'app.config/env' : 'default LAN IP');
export const BACKEND_BASE_URL: string = resolvedUrl;

// Developer note:
// - Default BACKEND_BASE_URL points to Prompt Processor (port 8000)
// - Port replacement logic in backendApi.ts: replace(':8000', ':8001') for Orchestrator calls
// - If running with app.json extra.backendUrl set to 8001, both instances will point to 8001
// - To override for physical device testing, set `expo.extra.backendUrl` in `app.json`
//   to your machine LAN IP, e.g. "http://192.168.1.25:8001" for simplified (single-call) flow
//   OR "http://192.168.1.25:8000" for two-call orchestration flow