# EAS Production Build - Quick Start

## Configuration Summary

The EAS production build is now configured to use the **Frontend** folder instead of ExpoFE.

### Key Configuration Files:
- **mobile/eas.json** - Main EAS configuration
- **mobile/pre-build.js** - Pre-build validation hook
- **Frontend/app.json** - Frontend app configuration
- **build-eas-production.ps1** - Build execution script

---

## Running the Build

### Option 1: Using PowerShell Script (Recommended)
```powershell
# Navigate to project root
cd c:\Upani\AI\Multiagenetic-Healthcare

# Build for all platforms
.\build-eas-production.ps1

# Build for specific platform
.\build-eas-production.ps1 -Platform android
.\build-eas-production.ps1 -Platform ios

# Preview the build command (dry run)
.\build-eas-production.ps1 -DryRun

# Wait for build completion
.\build-eas-production.ps1 -Wait
```

### Option 2: Direct EAS CLI
```bash
cd Frontend
eas build --platform all --profile production
```

### Option 3: Platform-Specific
```bash
# Android only
cd Frontend
eas build --platform android --profile production

# iOS only
cd Frontend
eas build --platform ios --profile production
```

---

## Build Profile Configuration

The production build profile includes:

### General Settings
- **Node Version**: 20.x
- **NPM Version**: 10.x
- **Pre-build Hook**: Validates Frontend setup before build
- **Cache**: Enabled for faster builds
- **Environment**: NODE_ENV=production

### iOS Configuration
- **Image**: macOS 14
- **Resource Class**: m1-large (optimized for faster builds)
- **Simulator**: Disabled (production build)
- **Configuration**: Release

### Android Configuration
- **Image**: Ubuntu 24.04
- **Build Type**: app-bundle (for Play Store)
- **Gradle Cache**: Enabled

---

## Pre-build Validation

The pre-build hook (`mobile/pre-build.js`) automatically:
1. ✓ Verifies Frontend directory exists
2. ✓ Checks critical files (app.json, package.json, etc.)
3. ✓ Validates required dependencies
4. ✓ Verifies Node/NPM versions
5. ✓ Validates app.json configuration
6. ✓ Confirms EAS projectId is set

---

## Monitoring the Build

1. **Local Terminal**: Watch the build progress in your terminal
2. **EAS Dashboard**: View detailed build logs at https://expo.dev/accounts/tnhgeneric
3. **Build Artifacts**: Access APK/IPA files from EAS dashboard after completion

---

## Common Build Issues

### Issue: "Frontend directory not found"
**Solution**: Ensure you're running the script from the project root directory

### Issue: "Dependencies not installed"
**Solution**: Run `npm install` in the Frontend folder first
```bash
cd Frontend
npm install
```

### Issue: "app.json missing EAS projectId"
**Solution**: Verify Frontend/app.json contains:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "1ab48f2d-774d-4476-aaaf-4904d148e21f"
      }
    }
  }
}
```

### Issue: Build fails with node_modules issues
**Solution**: Clear cache and reinstall
```bash
cd Frontend
rm -r node_modules package-lock.json
npm install
```

---

## Next Steps

1. Run the build script: `.\build-eas-production.ps1`
2. Monitor progress in terminal and EAS dashboard
3. Once complete, artifacts will be available on EAS dashboard
4. Download APK/IPA and test before release

---

## Documentation

Once the build completes successfully, comprehensive documentation will be automatically generated including:
- Build completion report
- Performance metrics
- Artifact details
- Deployment instructions
