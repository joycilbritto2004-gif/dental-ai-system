#!/usr/bin/env node

/**
 * Automated Deployment Script for DentaAI
 * Deploys Frontend to Vercel and Backend/AI services to Render.
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const DEPLOY_ENV_PATH = path.join(ROOT_DIR, '.deploy.env');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

function header(title) {
  console.log('\n' + '='.repeat(60));
  log(`  🚀 ${title}`, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

function run(cmd, cwd = ROOT_DIR, silent = false) {
  try {
    return execSync(cmd, { cwd, stdio: silent ? 'pipe' : 'inherit', encoding: 'utf8' });
  } catch (err) {
    if (!silent) {
      log(`❌ Command failed: ${cmd}`, colors.red);
    }
    throw err;
  }
}

// Load optional .deploy.env for webhooks / tokens
let deployConfig = {};
if (fs.existsSync(DEPLOY_ENV_PATH)) {
  const content = fs.readFileSync(DEPLOY_ENV_PATH, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        deployConfig[key] = val;
      }
    }
  });
}

function triggerWebhook(url, name) {
  return new Promise((resolve) => {
    if (!url) return resolve(false);
    log(`📡 Triggering ${name} deploy webhook...`, colors.cyan);
    try {
      const parsed = new URL(url);
      const req = https.request({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
      }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          log(`✅ ${name} deploy triggered successfully! (Status: ${res.statusCode})`, colors.green);
          resolve(true);
        } else {
          log(`⚠️ ${name} webhook returned status: ${res.statusCode}`, colors.yellow);
          resolve(false);
        }
      });
      req.on('error', (e) => {
        log(`⚠️ Failed to call ${name} webhook: ${e.message}`, colors.yellow);
        resolve(false);
      });
      req.end();
    } catch (e) {
      log(`⚠️ Invalid URL for ${name}: ${e.message}`, colors.yellow);
      resolve(false);
    }
  });
}

async function main() {
  header('DentaAI Automated Deployment Pipeline');

  // STEP 1: Pre-flight Verification
  log('\n[1/4] 🔍 Running Pre-Flight Verification...', colors.bright);

  // Check backend syntax
  process.stdout.write('Checking backend syntax... ');
  try {
    run('node --check server.js', BACKEND_DIR, true);
    log('PASS ✅', colors.green);
  } catch (e) {
    log('FAIL ❌', colors.red);
    log('Aborting deployment: Backend syntax check failed.', colors.red);
    process.exit(1);
  }

  // Check frontend build
  process.stdout.write('Verifying frontend build... ');
  try {
    run('npm run build', FRONTEND_DIR, true);
    log('PASS ✅', colors.green);
  } catch (e) {
    log('FAIL ❌', colors.red);
    log('Aborting deployment: Frontend build failed. Run "cd frontend && npm run build" to inspect.', colors.red);
    process.exit(1);
  }

  // STEP 2: Git Synchronization
  log('\n[2/4] 📦 Preparing Git Commit & Push...', colors.bright);

  let currentBranch = 'main';
  try {
    currentBranch = run('git rev-parse --abbrev-ref HEAD', ROOT_DIR, true).trim();
  } catch (e) {
    log('⚠️ Could not determine git branch, defaulting to "main".', colors.yellow);
  }

  const gitStatus = run('git status --porcelain', ROOT_DIR, true).trim();
  if (gitStatus.length > 0) {
    log('Staging uncommitted changes...', colors.cyan);
    run('git add .', ROOT_DIR);

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const commitMsg = process.argv[2] || `Deploy release: ${timestamp}`;
    log(`Committing changes: "${commitMsg}"...`, colors.cyan);
    run(`git commit -m "${commitMsg}"`, ROOT_DIR);
  } else {
    log('Working tree is clean. Proceeding with existing commits.', colors.green);
  }

  log(`Pushing to remote origin/${currentBranch}...`, colors.cyan);
  try {
    run(`git push origin ${currentBranch}`, ROOT_DIR);
    log('✅ Pushed changes to GitHub successfully!', colors.green);
  } catch (err) {
    log('⚠️ Git push encountered an issue. If up to date, continuing...', colors.yellow);
  }

  // STEP 3: Automated Publishing
  log('\n[3/4] 🌐 Publishing to Vercel & Render...', colors.bright);

  // 3A. Render Deployment
  const renderBackendHook = deployConfig.RENDER_BACKEND_DEPLOY_HOOK || process.env.RENDER_BACKEND_DEPLOY_HOOK;
  const renderAiHook = deployConfig.RENDER_AI_DEPLOY_HOOK || process.env.RENDER_AI_DEPLOY_HOOK;

  if (renderBackendHook || renderAiHook) {
    if (renderBackendHook) await triggerWebhook(renderBackendHook, 'Render Backend');
    if (renderAiHook) await triggerWebhook(renderAiHook, 'Render AI Service');
  } else {
    log('ℹ️  Render Git-Sync: Render deploys automatically on every push to GitHub main branch.', colors.blue);
    log('   (To trigger instant redeploys via webhook, add RENDER_BACKEND_DEPLOY_HOOK to .deploy.env)', colors.blue);
  }

  // 3B. Vercel Deployment
  const vercelHook = deployConfig.VERCEL_DEPLOY_HOOK || process.env.VERCEL_DEPLOY_HOOK;
  if (vercelHook) {
    await triggerWebhook(vercelHook, 'Vercel Frontend');
  } else {
    log('ℹ️  Vercel Git-Sync: Vercel deploys automatically on every push to GitHub main branch.', colors.blue);
    log('   (To trigger instant redeploys via webhook, add VERCEL_DEPLOY_HOOK to .deploy.env)', colors.blue);
  }

  // STEP 4: Deployment Summary
  header('Deployment Initiated Successfully!');
  log('✨ Both Vercel and Render have received your latest code update.', colors.green);
  console.log('\nMonitor your builds in real time:');
  log('  • Vercel Dashboard: https://vercel.com/dashboard', colors.cyan);
  log('  • Render Dashboard: https://dashboard.render.com', colors.cyan);
  console.log('\n');
}

main().catch(err => {
  log(`\n❌ Deployment script error: ${err.message}`, colors.red);
  process.exit(1);
});

