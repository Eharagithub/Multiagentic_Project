#!/usr/bin/env node

/**
 * EAS Production Pre-Build Script
 * 
 * This script runs before production build to ensure:
 * 1. Environment validation (backend URLs, API keys)
 * 2. Network security configuration
 * 3. Build configuration verification
 * 4. Asset validation
 * 5. Pre-build health checks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function warning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Main execution
async function prebuild() {
  section('EAS Production Pre-Build Validation');

  try {
    // 1. Validate app.json configuration
    log('\n1. Validating app.json configuration...', 'bold');
    validateAppJson();

    // 2. Validate eas.json configuration
    log('\n2. Validating eas.json configuration...', 'bold');
    validateEasJson();

    // 3. Validate environment variables
    log('\n3. Validating environment variables...', 'bold');
    validateEnvironment();

    // 4. Validate required files
    log('\n4. Validating required files...', 'bold');
    validateRequiredFiles();

    // 5. Validate network security configuration
    log('\n5. Validating network security configuration...', 'bold');
    validateNetworkSecurity();

    // 6. Validate dependencies
    log('\n6. Validating dependencies...', 'bold');
    validateDependencies();

    // 7. Pre-build health checks
    log('\n7. Running pre-build health checks...', 'bold');
    runHealthChecks();

    section('Pre-Build Validation Complete');
    success('All production pre-build validations passed!');
    success('Ready to proceed with EAS build...\n');
    
    process.exit(0);
  } catch (err) {
    section('Pre-Build Validation Failed');
    error(`${err.message}`);
    error('\nBuild cancelled due to validation errors.\n');
    process.exit(1);
  }
}

function validateAppJson() {
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  
  if (!fs.existsSync(appJsonPath)) {
    throw new Error('app.json not found');
  }

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  // Check required fields
  const requiredFields = [
    'expo.name',
    'expo.slug',
    'expo.version',
    'expo.android.package',
  ];

  for (const field of requiredFields) {
    const value = getNestedProperty(appJson, field);
    if (!value) {
      throw new Error(`Missing required field in app.json: ${field}`);
    }
  }

  // Validate Android configuration
  const androidConfig = appJson.expo.android;
  if (!androidConfig.package) {
    throw new Error('Android package name is required for production builds');
  }

  if (!androidConfig.package.match(/^[a-z][a-z0-9]*(\.[a-z0-9_]+)*$/)) {
    throw new Error(`Invalid Android package name format: ${androidConfig.package}`);
  }

  success(`app.json is valid (package: ${androidConfig.package})`);
}

function validateEasJson() {
  const easJsonPath = path.join(__dirname, '..', 'eas.json');
  
  if (!fs.existsSync(easJsonPath)) {
    throw new Error('eas.json not found');
  }

  const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));

  // Check production profile exists
  if (!easJson.build.production) {
    throw new Error('Production build profile not found in eas.json');
  }

  const production = easJson.build.production;

  // Validate Android build type
  if (production.android?.buildType !== 'app-bundle') {
    throw new Error('Android buildType must be "app-bundle" for production');
  }

  // Check for auto-increment
  if (production.autoIncrement !== true) {
    warning('autoIncrement is not enabled - version will not automatically increment');
  }

  success('eas.json production configuration is valid');
}

function validateEnvironment() {
  const productionBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

  if (!productionBackendUrl) {
    warning('EXPO_PUBLIC_BACKEND_URL environment variable not set');
    warning('Will use default from eas.json configuration');
  } else if (!productionBackendUrl.startsWith('https://')) {
    error('Production backend URL must use HTTPS for security');
    throw new Error(`Invalid backend URL: ${productionBackendUrl}`);
  } else {
    success(`Backend URL validated: ${productionBackendUrl}`);
  }

  // Check for other important env vars
  const importantVars = ['NODE_ENV', 'EXPO_DEBUG'];
  for (const varName of importantVars) {
    if (process.env[varName]) {
      warning(`${varName} is set: ${process.env[varName]}`);
    }
  }
}

function validateRequiredFiles() {
  const requiredFiles = [
    'app.json',
    'app.config.js',
    'eas.json',
    'package.json',
    'tsconfig.json',
  ];

  const missingFiles = [];
  const projectRoot = path.join(__dirname, '..');

  for (const file of requiredFiles) {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
  }

  success(`All required files present: ${requiredFiles.join(', ')}`);
}

function validateNetworkSecurity() {
  const networkSecurityPath = path.join(
    __dirname,
    '..',
    'android',
    'app',
    'src',
    'main',
    'res',
    'xml',
    'network_security_config.xml'
  );

  if (!fs.existsSync(networkSecurityPath)) {
    warning('network_security_config.xml not found - using default settings');
    return;
  }

  const config = fs.readFileSync(networkSecurityPath, 'utf8');

  // Check if production domains are configured
  if (config.includes('api.multiagenetic-healthcare.com')) {
    success('Production domain configured in network security');
  } else if (config.includes('cleartextTrafficPermitted="false"')) {
    success('Network security configured for HTTPS only');
  } else {
    warning('Review network_security_config.xml for production settings');
  }
}

function validateDependencies() {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const criticalDeps = [
    'expo',
    'react-native',
    'react',
    'expo-router',
  ];

  const missingDeps = [];
  for (const dep of criticalDeps) {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  }

  if (missingDeps.length > 0) {
    throw new Error(`Missing critical dependencies: ${missingDeps.join(', ')}`);
  }

  // Check for dev dependencies that shouldn't be in production
  const devOnlyDeps = ['expo-dev-client'];
  const prodOnlyIssues = [];

  for (const dep of devOnlyDeps) {
    if (packageJson.dependencies[dep]) {
      prodOnlyIssues.push(dep);
    }
  }

  if (prodOnlyIssues.length > 0) {
    warning(`Development dependencies in production: ${prodOnlyIssues.join(', ')}`);
    warning('These should be in devDependencies for production builds');
  }

  success('Dependency validation passed');
}

function runHealthChecks() {
  // Check Metro bundler cache
  const cacheDir = path.join(process.env.TEMP || '/tmp', 'metro-*');
  log('Metro cache status: (will be cleaned during build)');

  // Check for common build issues
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  const checks = [
    {
      name: 'App version format',
      check: () => {
        const version = appJson.expo.version;
        return version.match(/^\d+\.\d+\.\d+$/);
      },
    },
    {
      name: 'Icon file exists',
      check: () => {
        const iconPath = path.join(__dirname, '..', appJson.expo.icon);
        return fs.existsSync(iconPath);
      },
    },
    {
      name: 'Adaptive icon exists',
      check: () => {
        const iconPath = path.join(
          __dirname,
          '..',
          appJson.expo.android.adaptiveIcon.foregroundImage
        );
        return fs.existsSync(iconPath);
      },
    },
  ];

  for (const check of checks) {
    try {
      if (check.check()) {
        success(`${check.name}`);
      } else {
        warning(`${check.name} - may cause build issues`);
      }
    } catch (err) {
      warning(`${check.name} - skipped (${err.message})`);
    }
  }

  success('Health checks completed');
}

function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

// Run the pre-build
prebuild();
