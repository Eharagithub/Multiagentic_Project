# EAS Production Pre-Build - Pre-Flight Checklist

**Project:** ExpoFE Production Build  
**Date:** November 24, 2025  
**Status:** ✅ Ready for Launch

---

## Pre-Flight Checklist

Use this checklist before running production builds to ensure everything is configured correctly.

### ✅ Prerequisites

- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] EAS CLI installed (`eas --version`)
- [ ] Expo account created (https://expo.dev/signup)
- [ ] Logged into Expo (`eas whoami` shows username)

### ✅ ExpoFE Project Setup

- [ ] ExpoFE folder exists at `ExpoFE/`
- [ ] `npm install` completed (no errors)
- [ ] `node_modules` folder present
- [ ] `package-lock.json` present

### ✅ Configuration Files

- [ ] `app.json` exists and is valid JSON
- [ ] `eas.json` exists and is valid JSON
- [ ] `app.config.js` exists
- [ ] `tsconfig.json` exists
- [ ] `package.json` exists

### ✅ Build Configuration

- [ ] Android package name set: `com.tnhgeneric.multiagenetic`
- [ ] App version format: `1.0.0` (semantic versioning)
- [ ] App name set: `ExpoFE`
- [ ] Production profile in eas.json
- [ ] autoIncrement set to `true`
- [ ] buildType set to `app-bundle`

### ✅ Android Icons & Assets

- [ ] Icon file exists: `assets/icon.png` (192x192 minimum)
- [ ] Adaptive icon exists: `assets/adaptive-icon.png`
- [ ] Splash screen exists: `assets/splash-icon.png`
- [ ] All images are valid PNG format
- [ ] All paths in app.json are correct

### ✅ Backend Configuration

- [ ] Production backend URL ready: `https://api.multiagenetic-healthcare.com/health`
- [ ] Backend URL uses HTTPS (not HTTP)
- [ ] Backend service running and accessible
- [ ] Environment variable option: `EXPO_PUBLIC_BACKEND_URL` set (optional)

### ✅ Scripts & Tools

- [ ] Pre-build script exists: `scripts/prebuild-production.js`
- [ ] Build helper script exists: `scripts/build-production.js`
- [ ] Both scripts are executable
- [ ] Scripts have no syntax errors

### ✅ Documentation

- [ ] `PRODUCTION_PREBUILD_README.md` exists
- [ ] `PRODUCTION_PREBUILD_SETUP_COMPLETE.md` exists
- [ ] `PRODUCTION_PREBUILD_QUICKREF.md` exists
- [ ] Documentation is current and accurate

### ✅ Dependencies

- [ ] `react` installed (`npm list react`)
- [ ] `react-native` installed (`npm list react-native`)
- [ ] `expo` installed (`npm list expo`)
- [ ] `expo-router` installed (`npm list expo-router`)
- [ ] No `expo-dev-client` in dependencies (should be dev-only)
- [ ] No audit warnings: `npm audit`

### ✅ Git & Version Control

- [ ] `.gitignore` exists and includes `node_modules/`
- [ ] `.gitignore` includes sensitive files
- [ ] Recent commits present
- [ ] No uncommitted changes to critical files

### ✅ Expo Connection

- [ ] Logged in: `eas whoami` shows username
- [ ] Project initialized: `eas project:init` completed
- [ ] Project ID in app.json: `expo.owner` set to `tnhgeneric`

---

## Pre-Build Validation Checklist

Run these commands to validate before production build:

```powershell
# 1. Verify Node and npm
node --version        # Should be 16+
npm --version         # Should be 8+

# 2. Check Expo login
eas whoami            # Should show username

# 3. Verify package.json
npm list              # Check all dependencies

# 4. Run pre-build validation
cd ExpoFE
node scripts/prebuild-production.js
```

**Expected Output:**
```
✓ app.json is valid
✓ eas.json production configuration is valid
✓ Backend URL validated
✓ All required files present
✓ Dependency validation passed
✓ Health checks completed
✓ Ready to proceed with EAS build...
```

---

## Production Build Checklist

Before clicking "build", verify:

- [ ] Pre-build validation passed (all 7 checks)
- [ ] No errors in console output
- [ ] Backend URL set to production: `https://api.multiagenetic-healthcare.com/health`
- [ ] App version incremented if needed
- [ ] All configuration changes committed to git
- [ ] Build credits available in Expo account
- [ ] Internet connection stable
- [ ] Computer won't sleep during build (~15 minutes)

---

## Build Execution Checklist

When running the build:

```powershell
# 1. Navigate to project
cd ExpoFE

# 2. Run validation (optional, included in build-production.js)
node scripts/prebuild-production.js

# 3. Start interactive build (RECOMMENDED)
node scripts/build-production.js

# OR run direct EAS build
eas build --profile production --platform android
```

- [ ] Build command accepted (no immediate errors)
- [ ] Pre-build validation running
- [ ] All validation checks passing
- [ ] Build submitted to Expo cloud
- [ ] Build ID generated and displayed
- [ ] No timeout errors

---

## Post-Build Checklist

After build completes:

- [ ] Build status shows ✅ "Build finished"
- [ ] Build ID noted: `_______________________`
- [ ] AAB file available for download
- [ ] Download successful (file is valid AAB)
- [ ] File size reasonable (~50-150 MB typical)

### Testing Checklist

- [ ] Downloaded AAB from Expo dashboard
- [ ] Tested with internal app sharing OR
- [ ] Tested with bundletool conversion to APK OR
- [ ] Installed on test device
- [ ] App launches without errors
- [ ] Backend connectivity works
- [ ] All features functional
- [ ] No crashes on test device

### Play Store Submission Checklist

When ready to submit:

- [ ] Google Play Console account created
- [ ] $25 registration fee paid (one-time)
- [ ] App bundle uploaded to Play Console
- [ ] Store listing completed
- [ ] Screenshots added
- [ ] Description and privacy policy set
- [ ] Content rating filled out
- [ ] Pricing and distribution set
- [ ] Privacy policy URL configured
- [ ] App review submission ready

---

## Common Issues - Quick Fixes

### Issue: Pre-build validation fails

**Check:**
```powershell
node scripts/prebuild-production.js
```

**Read error message carefully:**
- Check each validation section
- Identify which check failed
- Refer to `PRODUCTION_PREBUILD_README.md` for fixes
- Correct the issue
- Rerun validation

### Issue: Backend URL error

**Fix:**
```powershell
# Must be HTTPS for production
$env:EXPO_PUBLIC_BACKEND_URL = "https://api.multiagenetic-healthcare.com/health"

# Verify
echo $env:EXPO_PUBLIC_BACKEND_URL
```

### Issue: Missing Android package name

**Fix in app.json:**
```json
{
  "expo": {
    "android": {
      "package": "com.tnhgeneric.multiagenetic"
    }
  }
}
```

### Issue: Not logged into Expo

**Fix:**
```powershell
eas login
# Enter credentials when prompted
eas whoami  # Verify
```

### Issue: Dependencies missing

**Fix:**
```powershell
cd ExpoFE
npm install
npm audit fix  # Fix vulnerabilities if needed
```

---

## Quick Status Check

Run this to verify everything is ready:

```powershell
# Create a batch script to check everything
@echo off
echo === EAS Production Build - Status Check ===
echo.
echo [1/7] Node Version:
node --version
echo.
echo [2/7] npm Version:
npm --version
echo.
echo [3/7] Expo Login:
eas whoami
echo.
echo [4/7] Package Manager:
cd ExpoFE && npm list react react-native expo 2>&1 | findstr "react@\|react-native@\|expo@"
echo.
echo [5/7] Configuration Files:
if exist app.json echo   ✓ app.json found
if exist eas.json echo   ✓ eas.json found
if exist package.json echo   ✓ package.json found
echo.
echo [6/7] Scripts:
if exist scripts\prebuild-production.js echo   ✓ prebuild-production.js found
if exist scripts\build-production.js echo   ✓ build-production.js found
echo.
echo [7/7] Pre-build Validation:
node scripts/prebuild-production.js
echo.
echo === Status Check Complete ===
```

---

## Build Readiness Score

### ✅ All Green (Ready to Build)
- All 7 pre-build validations pass
- All configuration files present
- All dependencies installed
- All icons and assets exist
- Logged into Expo
- Backend URL configured

### 🟡 Partially Ready (Review Required)
- Some validations show warnings
- Some configuration incomplete
- Missing optional assets
- Review specific warnings before building

### 🔴 Not Ready (Fix Required)
- Pre-build validation fails
- Critical configuration missing
- Dependencies not installed
- Icons or assets missing
- Not logged into Expo
- Fix issues before attempting build

---

## Support Resources

If you encounter issues:

1. **Read Pre-Build Output**
   - Errors and warnings are specific
   - Follow suggestions in error messages
   - Each validation check explains what's wrong

2. **Check Documentation**
   - `PRODUCTION_PREBUILD_README.md` - Full guide
   - `PRODUCTION_PREBUILD_QUICKREF.md` - Quick reference
   - `PRODUCTION_PREBUILD_SETUP_COMPLETE.md` - Overview

3. **Verify Configuration**
   - `ExpoFE/app.json` - App configuration
   - `ExpoFE/eas.json` - Build configuration
   - `ExpoFE/package.json` - Dependencies

4. **Check Logs**
   ```powershell
   eas build:logs --id <BUILD_ID>
   ```

5. **Expo Resources**
   - https://docs.expo.dev/build
   - https://forums.expo.dev/
   - https://expo.dev/support

---

## Pre-Build Validation Details

### What Gets Checked (7 Categories)

```
1. app.json
   ✓ Name, slug, version present
   ✓ Android package format valid
   ✓ Required fields complete

2. eas.json
   ✓ Production profile exists
   ✓ buildType is "app-bundle"
   ✓ autoIncrement enabled

3. Environment Variables
   ✓ Backend URL format (HTTPS)
   ✓ No development variables

4. Required Files
   ✓ app.json, app.config.js, eas.json
   ✓ package.json, tsconfig.json

5. Network Security
   ✓ Production domains configured
   ✓ HTTPS enforcement

6. Dependencies
   ✓ react, react-native, expo
   ✓ No dev-only in production

7. Health Checks
   ✓ Version semver format
   ✓ Icons exist and valid
   ✓ Assets available
```

---

## Build Timeline Expectations

| Phase | Time | What's Happening |
|-------|------|-----------------|
| Pre-Build Validation | ~30 sec | Your machine validates config |
| EAS Receives Request | ~1 min | Cloud build queued |
| Repository Clone | ~2 min | EAS downloads your code |
| Dependencies Install | ~3 min | npm install runs |
| Build Compilation | ~5 min | App compiled for Android |
| Signing & AAB Gen | ~2 min | APK bundled for Play Store |
| Upload to Expo | ~1 min | Build uploaded to dashboard |
| **Total** | **~15 min** | **Complete** |

---

## Final Verification

Before Production Build:

✅ **Code:** All changes committed  
✅ **Config:** app.json and eas.json verified  
✅ **Dependencies:** npm install completed  
✅ **Backend:** Production URL configured  
✅ **Assets:** All icons and images present  
✅ **Login:** eas whoami shows username  
✅ **Validation:** Pre-build script passes  

**Status:** 🚀 **READY FOR PRODUCTION BUILD**

---

```powershell
# When everything is green, run:
cd ExpoFE
node scripts/build-production.js

# Or direct command:
eas build --profile production --platform android
```

---

**Last Verified:** November 24, 2025  
**System:** Production Ready ✅  
**Status:** All Systems Go 🚀
