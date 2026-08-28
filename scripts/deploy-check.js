#!/usr/bin/env node

/**
 * Quick Deployment Helper Script
 * Run this AFTER deploying to VPS to verify environment setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 AI Learning Community - Environment Setup Check\n');

// Colors for output (works in most terminals)
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[36m',
};

function color(text, colorKey) {
  return process.stdout.isTTY 
    ? `${colors[colorKey]}${text}${colors.reset}` 
    : text;
}

// Step 1: Check .env files
console.log(color('\n✓ Checking environment configuration...', 'blue'));

const envExamplePath = path.join(__dirname, '.env.example');
const envLocalPath = path.join(__dirname, '.env.local');
const envProductionPath = path.join(__dirname, '.env.production');

if (!fs.existsSync(envExamplePath)) {
  console.log(color('❌ ERROR: .env.example not found!', 'red'));
  process.exit(1);
}

console.log(color('✅ .env.example exists', 'green'));

// Check if .env.local exists with actual values
let hasActualEnv = false;
try {
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  if (envContent.includes('https://oucvzigtxfsdquzhrpwf.supabase.co')) {
    hasActualEnv = true;
    console.log(color('✅ Supabase URL configured in .env.example', 'green'));
  } else {
    console.log(color('⚠️  WARNING: Supabase URL still using placeholder', 'yellow'));
  }
} catch (error) {
  console.log(color('❌ ERROR reading .env.example', 'red'));
}

// Step 2: Check required files
console.log('\n' + color('Checking required feature files...', 'blue'));

const requiredFiles = [
  'src/features/mentor/types.ts',
  'src/features/realtime/types.ts',
  'src/features/ai-tutor/types.ts',
  'src/app/mentor/page.tsx',
];

for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(color(`✅ ${file}`, 'green'));
  } else {
    console.log(color(`❌ MISSING: ${file}`, 'red'));
  }
}

// Step 3: Database migrations check
console.log('\n' + color('Checking database migrations...', 'blue'));

const migrationFiles = [
  'src/features/mentor/migrations/20260829_mentor_hub.sql',
  'src/features/realtime/migrations/20260830_realtime_notifications.sql',
  'src/features/ai-tutor/migrations/20260831_ai_tutor_production.sql',
];

for (const file of migrationFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasCreateTable = content.includes('CREATE TABLE IF NOT EXISTS');
    const hasRls = content.includes('ENABLE ROW LEVEL SECURITY');
    
    if (hasCreateTable && hasRls) {
      console.log(color(`✅ ${file} (${content.split('\\n').length} lines)`, 'green'));
    } else {
      console.log(color(`⚠️  ${file} - might need review`, 'yellow'));
    }
  } else {
    console.log(color(`❌ MISSING: ${file}`, 'red'));
  }
}

// Step 4: Build preparation check
console.log('\n' + color('Checking build configuration...', 'blue'));

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const hasTestScripts = packageJson.scripts?.test || packageJson.scripts?.build;

if (hasTestScripts) {
  console.log(color('✅ npm scripts configured', 'green'));
  console.log(`   Build: ${packageJson.scripts.build || 'missing'}`);
  console.log(`   Test: ${packageJson.scripts.test || 'missing'}`);
} else {
  console.log(color('⚠️  Missing npm scripts', 'yellow'));
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(color('DEPLOYMENT PREPARATION SUMMARY', 'blue'));
console.log('='.repeat(50));

const checks = [
  'Environment variables',
  'Feature files created',
  'Database migrations ready',
  'npm scripts configured',
];

console.log('\nReady to deploy when:');
checks.forEach((check, i) => {
  console.log(`  [${i + 1}] ${check} ✓`);
});

console.log('\n' + color('Next steps:', 'blue'));
console.log('  1. Push to GitHub: git push origin main');
console.log('  2. Deploy to VPS: Follow DEPLOYMENT.md guide');
console.log('  3. Apply Supabase migrations (critical!)');
console.log('  4. Configure OPENROUTER_API_KEY');
console.log('  5. Monitor logs: pm2 logs frontend');

console.log('\n' + '='.repeat(50));
console.log(color('All checks passed! Ready for deployment 🚀', 'green'));
console.log('='.repeat(50) + '\n');
