#!/usr/bin/env node

/**
 * EAS Production Build Quick Start Script
 * 
 * Usage:
 *   node scripts/build-production.js              // Interactive mode
 *   node scripts/build-production.js --skip-prebuild  // Skip pre-build validation
 *   node scripts/build-production.js --clear-cache    // Clear build cache
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  underline: '\x1b[4m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(70)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(`${'='.repeat(70)}\n`, 'cyan');
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

function info(message) {
  log(`ℹ ${message}`, 'cyan');
}

async function main() {
  const args = process.argv.slice(2);
  const skipPrebuild = args.includes('--skip-prebuild');
  const clearCache = args.includes('--clear-cache');
  const isInteractive = args.length === 0;

  section('EAS Production Build Helper');

  try {
    // Check EAS CLI
    log('Checking prerequisites...', 'bold');
    checkEasCli();
    checkExpoLogin();
    success('All prerequisites met\n');

    // Show current configuration
    log('Current Configuration:', 'bold');
    displayConfiguration();

    // Pre-build validation
    if (!skipPrebuild) {
      section('Running Pre-Build Validation');
      runPrebuild();
    }

    // Interactive confirmation if in interactive mode
    if (isInteractive) {
      const confirmed = await confirm(
        '\nProceed with production build? (This will use Expo build credits)'
      );
      if (!confirmed) {
        log('\n✓ Build cancelled', 'yellow');
        process.exit(0);
      }
    }

    // Run build
    section('Starting EAS Production Build');
    runProductionBuild(clearCache);

  } catch (err) {
    error(`\n${err.message}`);
    process.exit(1);
  }
}

function checkEasCli() {
  try {
    execSync('eas --version', { stdio: 'pipe' });
  } catch (err) {
    throw new Error('EAS CLI not found. Install with: npm install -g eas-cli');
  }
}

function checkExpoLogin() {
  try {
    const result = execSync('eas whoami', { stdio: 'pipe', encoding: 'utf8' });
    if (!result.includes('@')) {
      throw new Error('Not logged into Expo');
    }
    const username = result.trim();
    info(`Logged in as: ${username}`);
  } catch (err) {
    throw new Error(
      'Not logged into Expo. Run: eas login\nOr visit: https://expo.dev/signup'
    );
  }
}

function displayConfiguration() {
  const appJsonPath = path.join(__dirname, '..', 'app.json');
  const easJsonPath = path.join(__dirname, '..', 'eas.json');

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));

  const config = {
    'App Name': appJson.expo.name,
    'Package': appJson.expo.android.package,
    'Version': appJson.expo.version,
    'Build Type': 'app-bundle (Android)',
    'Auto Increment': easJson.build.production.autoIncrement ? 'Yes' : 'No',
    'Backend URL': process.env.EXPO_PUBLIC_BACKEND_URL || 'https://api.multiagenetic-healthcare.com/health',
  };

  for (const [key, value] of Object.entries(config)) {
    console.log(`  ${key.padEnd(20)} : ${value}`);
  }
}

function runPrebuild() {
  const prebuildPath = path.join(__dirname, 'prebuild-production.js');
  
  if (!fs.existsSync(prebuildPath)) {
    warning('Pre-build script not found. Skipping validation.');
    return;
  }

  try {
    execSync(`node ${prebuildPath}`, { stdio: 'inherit' });
  } catch (err) {
    throw new Error('Pre-build validation failed. Build cancelled.');
  }
}

function runProductionBuild(clearCache) {
  const command = clearCache
    ? 'eas build --profile production --platform android --clear-cache'
    : 'eas build --profile production --platform android';

  log(`Running: ${command}\n`, 'bold');
  
  try {
    execSync(command, { stdio: 'inherit' });
    section('Build Process Complete');
    success('Production build submitted to EAS');
    
    log('\nNext Steps:', 'bold');
    console.log('  1. Monitor build progress: eas build:view');
    console.log('  2. Stream build logs: eas build:logs');
    console.log('  3. Download build when ready');
    console.log('  4. Test with internal app sharing or direct installation');
    console.log('  5. Submit to Google Play Store when ready\n');

  } catch (err) {
    throw new Error('Build command failed');
  }
}

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`\n${colors.yellow}${question} (y/n): ${colors.reset}`, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Run main
main().catch((err) => {
  error(err.message);
  process.exit(1);
});
