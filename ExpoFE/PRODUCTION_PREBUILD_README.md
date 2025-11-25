# EAS Production Pre-Build Guide

## Overview

This guide covers the production pre-build process for the EAS build system. The pre-build ensures all configurations, dependencies, and security settings are properly validated before the production build runs on Expo's servers.

## What is a Pre-Build?

A pre-build is a script that runs **before** the EAS build process begins. It:
- Validates all required configurations
- Checks environment variables
- Verifies network security settings
- Ensures all dependencies are correct
- Performs health checks
- Prevents invalid builds from starting

## Pre-Build Execution Flow

```
1. Developer runs: eas build --profile production --platform android
        ↓
2. EAS reads eas.json and finds prebuildCommand
        ↓
3. Pre-build script runs: scripts/prebuild-production.js
        ↓
4. Pre-build validates configurations
        ↓
5. If validation passes → EAS build continues
   If validation fails → Build cancelled, no cloud resources wasted
```

## Current Production Configuration

### app.json (Production Settings)
```json
{
  "expo": {
    "name": "ExpoFE",
    "version": "1.0.0",
    "android": {
      "package": "com.tnhgeneric.multiagenetic",
      "buildType": "app-bundle"
    },
    "extra": {
      "backendUrl": "http://192.168.1.25:8001"  // Update for production
    }
  }
}
```

**For Production, Update To:**
```json
{
  "extra": {
    "backendUrl": "https://api.multiagenetic-healthcare.com"
  }
}
```

### eas.json (Production Profile)
```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      },
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://api.multiagenetic-healthcare.com/health"
      },
      "prebuildCommand": "node scripts/prebuild-production.js"
    }
  }
}
```

## Pre-Build Validations

The pre-build script performs these checks:

### 1. **app.json Configuration** ✓
- Required fields present
- Android package name format valid
- Icon and assets references valid

### 2. **eas.json Configuration** ✓
- Production profile exists
- Android buildType is "app-bundle"
- autoIncrement is enabled

### 3. **Environment Variables** ✓
- EXPO_PUBLIC_BACKEND_URL format (must be HTTPS)
- No conflicting development variables

### 4. **Required Files** ✓
- app.json, app.config.js, eas.json
- package.json, tsconfig.json

### 5. **Network Security** ✓
- Production domains configured
- HTTPS enforcement checked

### 6. **Dependencies** ✓
- Critical dependencies present (expo, react-native, react)
- No dev-only dependencies in production

### 7. **Health Checks** ✓
- App version format (semver)
- Icons and assets exist
- Overall build readiness

## Running a Production Build

### Step 1: Prepare Environment

```powershell
# Navigate to ExpoFE folder
cd ExpoFE

# Install/update dependencies
npm install

# Ensure you're logged into Expo
eas login
```

### Step 2: Update Production URLs

Update the backend URLs in your configuration:

**In app.json:**
```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://api.multiagenetic-healthcare.com"
    }
  }
}
```

**Environment Variable (optional):**
```powershell
# Set production backend URL
$env:EXPO_PUBLIC_BACKEND_URL = "https://api.multiagenetic-healthcare.com/health"
```

### Step 3: Run Pre-Build Validation (Optional - runs automatically)

```powershell
# Manually run pre-build to check before actual build
node scripts/prebuild-production.js
```

### Step 4: Trigger Production Build

```powershell
# Build for Android production
eas build --profile production --platform android

# Or with specific channel
eas build --profile production --platform android --channel production
```

### Step 5: Monitor Build Progress

```powershell
# View build status
eas build:view

# Stream build logs
eas build:logs

# List all builds
eas build:list
```

## What to Expect During Pre-Build

### Successful Pre-Build Output:

```
============================================================
  EAS Production Pre-Build Validation
============================================================

1. Validating app.json configuration...
✓ app.json is valid (package: com.tnhgeneric.multiagenetic)

2. Validating eas.json configuration...
✓ eas.json production configuration is valid

3. Validating environment variables...
✓ Backend URL validated: https://api.multiagenetic-healthcare.com/health

4. Validating required files...
✓ All required files present: app.json, app.config.js, eas.json, package.json, tsconfig.json

5. Validating network security configuration...
✓ Production domain configured in network security

6. Validating dependencies...
✓ Dependency validation passed

7. Running pre-build health checks...
✓ App version format
✓ Icon file exists
✓ Adaptive icon exists
✓ Health checks completed

============================================================
Pre-Build Validation Complete
============================================================
✓ All production pre-build validations passed!
✓ Ready to proceed with EAS build...
```

### Common Validation Errors & Fixes

#### Error: "Missing required field in app.json: expo.android.package"

**Cause:** Android package name not configured
**Fix:**
```json
// In app.json, add:
{
  "expo": {
    "android": {
      "package": "com.tnhgeneric.multiagenetic"
    }
  }
}
```

#### Error: "Android buildType must be 'app-bundle' for production"

**Cause:** eas.json configured for APK instead of app bundle
**Fix:**
```json
// In eas.json, update:
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

#### Error: "Production backend URL must use HTTPS for security"

**Cause:** Using HTTP instead of HTTPS
**Fix:** Update environment variable or eas.json:
```powershell
# Correct format
$env:EXPO_PUBLIC_BACKEND_URL = "https://api.multiagenetic-healthcare.com/health"

# Not this
$env:EXPO_PUBLIC_BACKEND_URL = "http://api.multiagenetic-healthcare.com/health"
```

#### Warning: "Development dependencies in production"

**Cause:** expo-dev-client or similar dev package in dependencies
**Fix:**
```powershell
# Move to devDependencies
npm uninstall expo-dev-client
npm install --save-dev expo-dev-client
```

## Production Build Output

After successful pre-build and build completion, you'll receive:

1. **Build ID:** Unique identifier for this build
2. **Status:** ✔ Build finished
3. **Artifacts:** Android App Bundle (.aab) file
4. **Location:** URL to download from Expo dashboard

Example:
```
Build ID: c130b944-b1b7-4cd4-8c44-d3d018326170
Status: ✔ Build finished
Location: https://expo.dev/artifacts/eas/pRDt5CU92KZCMmxRxmxgBN.aab
```

## Next Steps After Successful Build

### Option 1: Play Store Submission
1. Log into Google Play Console
2. Create a release
3. Upload the .aab file
4. Complete store listing
5. Submit for review

### Option 2: Internal Testing
1. Use Google Play Console's Internal App Sharing
2. Upload the .aab file
3. Share test link with team

### Option 3: Local Testing with Bundletool
```powershell
# Download AAB from Expo
# Then convert to APK for testing

bundletool build-apks --bundle=./app.aab --output=./app.apks
bundletool install-apks --apks=./app.apks
```

## Troubleshooting Pre-Build Issues

### Pre-Build Script Not Found

**Error:** `Cannot find module 'scripts/prebuild-production.js'`

**Solution:**
- Ensure file exists at `ExpoFE/scripts/prebuild-production.js`
- Check eas.json has correct path: `"prebuildCommand": "node scripts/prebuild-production.js"`
- Verify you're in the ExpoFE directory when running build

### Pre-Build Fails During Validation

**Steps:**
1. Run pre-build manually: `node scripts/prebuild-production.js`
2. Read error messages carefully
3. Fix the specific validation error
4. Rerun pre-build until it passes
5. Then run actual build: `eas build --profile production --platform android`

### Build Still Fails After Pre-Build Passes

**Possible Causes:**
- Network issues during build
- Missing EAS credentials
- Backend service unavailable
- EAS cloud environment issues

**Solutions:**
1. Check EAS build logs: `eas build:logs --id <BUILD_ID>`
2. Verify EAS login: `eas whoami`
3. Clear build cache: `eas build --profile production --platform android --clear-cache`

## Development vs Production Workflows

### Development Build
```powershell
# Uses local backend, includes dev tools
eas build --profile development --platform android
```

### Preview Build
```powershell
# Tests production configuration without live backend
eas build --profile preview --platform android
```

### Production Build
```powershell
# Full production, pre-build validation, production backend URLs
eas build --profile production --platform android
```

## Important Reminders

⚠️ **For Production:**
1. Always use HTTPS URLs for backends
2. Set `autoIncrement: true` for version management
3. Android package name must remain consistent
4. All icons and assets must be present
5. Never commit sensitive credentials to git
6. Test preview build before production build

✓ **Best Practices:**
1. Run pre-build manually before actual build
2. Monitor build progress in dashboard
3. Keep eas.json and app.json in version control
4. Document any environment-specific changes
5. Test builds with internal sharing before Play Store

## Version Management

The production profile includes `autoIncrement: true`, which means:

- Each build automatically increments the versionCode
- versionName remains as specified in app.json
- Prevents version conflicts on Play Store
- Ensures proper update detection for users

Current version: `1.0.0` (versionCode auto-increments)

## Support & Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Configuration](https://docs.expo.dev/versions/latest/config/app/)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Google Play Console](https://play.google.com/console)
- [Expo Forums](https://forums.expo.dev/)

## Quick Reference Commands

```powershell
# Pre-build validation only
node scripts/prebuild-production.js

# Production build
eas build --profile production --platform android

# View build status
eas build:view

# Stream logs
eas build:logs

# List builds
eas build:list

# Submit to Play Store
eas submit -p android

# Clear build cache
eas build --profile production --platform android --clear-cache
```
