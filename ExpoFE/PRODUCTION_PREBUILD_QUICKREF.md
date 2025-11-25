# EAS Production Pre-Build - Quick Reference

## One-Line Build Commands

```powershell
# Interactive (recommended)
cd ExpoFE && node scripts/build-production.js

# Direct build
cd ExpoFE && eas build --profile production --platform android

# With cache clear
cd ExpoFE && eas build --profile production --platform android --clear-cache

# Pre-build validation only
cd ExpoFE && node scripts/prebuild-production.js
```

## Pre-Build Validation Steps

The system automatically validates:

1. ✓ **app.json** - Package name, version, required fields
2. ✓ **eas.json** - Production profile, app-bundle type, auto-increment
3. ✓ **Environment** - HTTPS URLs, no dev variables
4. ✓ **Files** - app.json, app.config.js, eas.json, package.json, tsconfig.json
5. ✓ **Security** - Production domains, HTTPS enforcement
6. ✓ **Dependencies** - Expo, React, React Native, no dev-only packages
7. ✓ **Health** - Version format, icons exist, assets valid

## Configuration Overview

| Setting | Value | Location |
|---------|-------|----------|
| App Name | ExpoFE | app.json |
| Package | com.tnhgeneric.multiagenetic | app.json |
| Version | 1.0.0 | app.json |
| Build Type | app-bundle (AAB) | eas.json |
| Build Profile | production | eas.json |
| Backend URL | https://api.multiagenetic-healthcare.com/health | eas.json |
| Pre-Build | scripts/prebuild-production.js | eas.json |
| Auto Increment | true | eas.json |

## Environment Setup

```powershell
# Set backend URL for production
$env:EXPO_PUBLIC_BACKEND_URL = "https://api.multiagenetic-healthcare.com/health"

# Verify it's set
echo $env:EXPO_PUBLIC_BACKEND_URL

# Login to Expo
eas login

# Check login status
eas whoami
```

## Build Status Monitoring

```powershell
# View latest build
eas build:view

# Stream logs (real-time)
eas build:logs

# List all builds
eas build:list

# Detailed build info
eas build:logs --id <BUILD_ID>
```

## What to Expect

### Successful Pre-Build (takes ~30 seconds)
```
✓ app.json is valid
✓ eas.json production configuration is valid
✓ Backend URL validated
✓ All required files present
✓ Dependency validation passed
✓ Health checks completed
✓ Ready to proceed with EAS build...
```

### Successful Cloud Build (takes 10-20 minutes)
```
Build ID: c130b944-b1b7-4cd4-8c44-d3d018326170
Status: ✔ Build finished
Location: https://expo.dev/artifacts/eas/...
```

## Post-Build Testing

### Option 1: Internal App Sharing (No fees)
1. Go to play.google.com/console
2. Click "Internal App Sharing"
3. Upload AAB from Expo dashboard
4. Share test link with testers

### Option 2: Direct Installation
```powershell
# Download AAB, then convert to APK
bundletool build-apks --bundle=./app.aab --output=./app.apks
bundletool install-apks --apks=./app.apks
```

### Option 3: Play Store Submission
1. Open Google Play Console
2. Create new release
3. Upload AAB file
4. Complete store listing
5. Submit for review

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Pre-build fails validation | Check error message, fix issue, rerun `node scripts/prebuild-production.js` |
| Missing Android package | Add to app.json: `"android": { "package": "com.tnhgeneric.multiagenetic" }` |
| HTTP URL in production | Change to HTTPS: `https://api.multiagenetic-healthcare.com` |
| Not logged in | Run: `eas login` |
| Pre-build script not found | Ensure file exists: `ExpoFE/scripts/prebuild-production.js` |
| Build still fails | Check logs: `eas build:logs --id <BUILD_ID>` |

## Essential Files

```
ExpoFE/
├── eas.json                              (Updated with pre-build)
├── app.json                              (Production config)
├── scripts/
│   ├── prebuild-production.js            (Validation script)
│   └── build-production.js               (Quick start helper)
└── PRODUCTION_PREBUILD_README.md         (Full guide)
```

## Important Reminders

🔒 **Security:**
- Always use HTTPS for production URLs
- Never commit API keys to git
- Store sensitive credentials in environment variables

📋 **Configuration:**
- Android package name: com.tnhgeneric.multiagenetic
- Version must be semver: X.Y.Z (e.g., 1.0.0)
- autoIncrement: true (for Play Store updates)

✅ **Before Build:**
- Ensure dependencies installed: `npm install`
- Logged into Expo: `eas whoami`
- Backend URL set correctly
- All icons and assets exist

🚀 **Best Practices:**
- Run pre-build validation first
- Test preview build before production
- Monitor build in Expo dashboard
- Use internal app sharing for testing
- Keep eas.json and app.json in git

## Pre-Build Validation Details

### What Gets Checked (7 Categories)

```
app.json
  ✓ Expo name, slug, version
  ✓ Android package format: com.company.app
  ✓ Required fields present

eas.json
  ✓ Production profile exists
  ✓ buildType is "app-bundle"
  ✓ autoIncrement is true

Environment
  ✓ Backend URL format (HTTPS)
  ✓ No development variables

Files
  ✓ app.json, app.config.js, eas.json
  ✓ package.json, tsconfig.json

Network Security
  ✓ Production domains configured
  ✓ HTTPS enforcement

Dependencies
  ✓ Expo, React, React Native installed
  ✓ No dev-only packages

Health
  ✓ Version: 1.0.0 (semver)
  ✓ Icons exist and are valid
  ✓ Assets available
```

## Failed Validation Example

```
✗ Production backend URL must use HTTPS for security
  Current: http://api.multiagenetic-healthcare.com
  Required: https://api.multiagenetic-healthcare.com
  
FIX:
$env:EXPO_PUBLIC_BACKEND_URL = "https://api.multiagenetic-healthcare.com/health"
```

## Complete Build Workflow

```
1. PREPARE
   cd ExpoFE
   npm install
   eas login

2. CONFIGURE
   Update app.json with production URLs
   Set environment variables

3. VALIDATE
   node scripts/prebuild-production.js
   (Checks 7 categories automatically)

4. BUILD
   eas build --profile production --platform android
   (Runs on Expo's cloud servers ~10-20 min)

5. TEST
   Download AAB from Expo
   Use internal app sharing
   OR direct installation

6. DEPLOY
   Submit to Google Play Store
   OR distribute directly
```

## Key Environment Variables

```powershell
# Production backend (required for production build)
$env:EXPO_PUBLIC_BACKEND_URL = "https://api.multiagenetic-healthcare.com/health"

# Expo login (if needed)
eas login

# Verify setup
eas whoami                              # Check login
node scripts/prebuild-production.js     # Validate config
```

## Files Modified

- ✅ **ExpoFE/eas.json** - Added production pre-build configuration
- ✅ **ExpoFE/scripts/prebuild-production.js** - Validation script (NEW)
- ✅ **ExpoFE/scripts/build-production.js** - Helper script (NEW)
- ✅ **ExpoFE/PRODUCTION_PREBUILD_README.md** - Full documentation (NEW)
- ✅ **ExpoFE/PRODUCTION_PREBUILD_SETUP_COMPLETE.md** - Summary (NEW)

## Production Profile Details

```json
{
  "build": {
    "production": {
      "autoIncrement": true,                    // Version auto-increments
      "android": {
        "buildType": "app-bundle"               // AAB format for Play Store
      },
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://..." // Production backend
      },
      "prebuildCommand": "node scripts/prebuild-production.js"  // Validation
    }
  }
}
```

## Status: ✅ READY FOR PRODUCTION BUILD

All systems configured and validated. Ready to build!

```powershell
cd ExpoFE && node scripts/build-production.js
```

---

**Last Updated:** November 24, 2025  
**Status:** Production Ready ✅  
**Documentation:** Complete ✅  
**Validation:** Automated ✅
