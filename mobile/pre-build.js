#!/usr/bin/env node

/**
 * EAS Pre-build Hook for Frontend Integration
 * This script prepares the Frontend folder for EAS production build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const buildDir = path.join(__dirname, '..');
const frontendDir = path.join(buildDir, 'Frontend');
const mobileDir = __dirname;

console.log('🚀 Starting EAS Production Pre-build Hook...\n');

try {
  // Step 1: Verify Frontend directory exists
  console.log('✓ Checking Frontend directory...');
  if (!fs.existsSync(frontendDir)) {
    throw new Error(`Frontend directory not found at ${frontendDir}`);
  }
  console.log(`  Frontend directory found: ${frontendDir}\n`);

  // Step 2: Verify critical Frontend files
  console.log('✓ Verifying critical Frontend files...');
  const criticalFiles = [
    'package.json',
    'app.json',
    'tsconfig.json',
    'app'
  ];

  criticalFiles.forEach(file => {
    const filePath = path.join(frontendDir, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Critical file missing: ${file}`);
    }
    console.log(`  ✓ ${file}`);
  });
  console.log();

  // Step 3: Check Frontend dependencies
  console.log('✓ Verifying Frontend dependencies...');
  const frontendPackageJson = JSON.parse(
    fs.readFileSync(path.join(frontendDir, 'package.json'), 'utf8')
  );

  const requiredDeps = [
    'expo',
    'react',
    'react-native',
    'expo-router'
  ];

  requiredDeps.forEach(dep => {
    if (!frontendPackageJson.dependencies[dep]) {
      throw new Error(`Required dependency missing: ${dep}`);
    }
    console.log(`  ✓ ${dep}: ${frontendPackageJson.dependencies[dep]}`);
  });
  console.log();

  // Step 4: Environment validation
  console.log('✓ Validating environment...');
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`  Node version: ${nodeVersion}`);
  console.log(`  NPM version: ${npmVersion}\n`);

  // Step 5: Verify app.json configuration
  console.log('✓ Verifying app.json configuration...');
  const appJson = JSON.parse(
    fs.readFileSync(path.join(frontendDir, 'app.json'), 'utf8')
  );

  if (!appJson.expo) {
    throw new Error('app.json missing expo configuration');
  }

  if (!appJson.expo.extra?.eas?.projectId) {
    throw new Error('app.json missing EAS projectId');
  }

  console.log(`  Project ID: ${appJson.expo.extra.eas.projectId}`);
  console.log(`  Package: ${appJson.expo.android?.package || 'Not specified'}`);
  console.log(`  Version: ${appJson.expo.version}\n`);

  console.log('✅ Pre-build validation completed successfully!\n');
  console.log('📦 Build is ready for EAS production deployment');
  process.exit(0);

} catch (error) {
  console.error(`\n❌ Pre-build hook failed: ${error.message}\n`);
  process.exit(1);
}
