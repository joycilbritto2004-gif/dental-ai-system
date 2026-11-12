#!/usr/bin/env node

/**
 * DentaAI Universal Service Runner
 * Boots all 3 services concurrently in a single terminal:
 *  1. Python AI Model Service (Port 5002)
 *  2. Node.js Express Backend (Port 5000)
 *  3. React Vite Frontend (Port 5173)
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const AI_DIR = path.join(ROOT_DIR, 'ai_model');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// ANSI color escapes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

// Free a port if an orphaned process is holding it
function freePort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = output.trim().split(/\r?\n/);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4 && parts[3] === 'LISTENING') {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && pid !== String(process.pid)) {
            try {
              execSync(`taskkill /pid ${pid} /F`, { stdio: 'ignore' });
            } catch (e) {}
          }
        }
      }
    } else {
      execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
    }
  } catch (e) {
    // Port is likely already free
  }
}

// Determine Python executable
function getPythonCommand() {
  const venvPaths = [
    path.join(AI_DIR, 'venv', 'Scripts', 'python.exe'),
    path.join(AI_DIR, '.venv', 'Scripts', 'python.exe'),
    path.join(BACKEND_DIR, 'venv', 'Scripts', 'python.exe'),
    path.join(AI_DIR, 'venv', 'bin', 'python'),
    path.join(ROOT_DIR, 'venv', 'Scripts', 'python.exe'),
  ];

  for (const p of venvPaths) {
    if (fs.existsSync(p)) return p;
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

const processes = [];

function killProcessTree(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch (e) {
    // Process may have already exited
  }
}

function shutdown() {
  console.log(`\n\n${colors.yellow}${colors.bold}🛑 Stopping all DentaAI services...${colors.reset}`);
  for (const proc of processes) {
    if (proc && proc.pid) {
      killProcessTree(proc.pid);
    }
  }
  console.log(`${colors.green}All services stopped cleanly.${colors.reset}\n`);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', () => {
  for (const proc of processes) {
    if (proc && proc.pid) {
      killProcessTree(proc.pid);
    }
  }
});

function printBanner() {
  console.clear();
  console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════════════╗
║${colors.bold}                 🦷 DentaAI Universal Service Runner              ${colors.reset}${colors.cyan}║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  ${colors.green}🌐 Frontend UI:${colors.reset}    ${colors.bold}http://localhost:5173${colors.reset}                         ║
║  ${colors.cyan}⚙️  Backend API:${colors.reset}    ${colors.bold}http://localhost:5000${colors.reset}                         ║
║  ${colors.magenta}🧠 AI Model API:${colors.reset}   ${colors.bold}http://localhost:5002${colors.reset}                         ║
║                                                                  ║
║  ${colors.yellow}🔑 Demo Accounts:${colors.reset}                                               ║
║     • Doctor:  ${colors.bold}priya.menon@dentaai.com${colors.reset} / ${colors.bold}DoctorPassword123!${colors.reset}      ║
║     • Admin:   ${colors.bold}admin@dentaai.com${colors.reset}       / ${colors.bold}AdminPassword123!${colors.reset}       ║
║     • Patient: Self-register via the UI Register page            ║
║                                                                  ║
║  ${colors.gray}Press ${colors.bold}Ctrl + C${colors.reset}${colors.gray} in this window to stop all 3 services at once.${colors.reset}${colors.cyan}   ║
╚══════════════════════════════════════════════════════════════════╝${colors.reset}
`);
}

function pipeOutput(stream, prefix, color) {
  let buffer = '';
  stream.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim().length > 0) {
        console.log(`${color}${prefix}${colors.reset} ${line}`);
      }
    }
  });
}

function startServices() {
  printBanner();

  console.log(`${colors.gray}Checking and freeing ports (5000, 5002, 5173)...${colors.reset}`);
  freePort(5000);
  freePort(5002);
  freePort(5173);

  const pythonCmd = getPythonCommand();
  const viteJs = path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js');

  console.log(`${colors.gray}Launching AI Engine, Express Backend, and Vite UI...${colors.reset}\n`);

  // 1. Start Python AI Service
  const aiProc = spawn(pythonCmd, ['app.py'], {
    cwd: AI_DIR,
    env: { ...process.env, AI_SERVICE_PORT: '5002', PYTHONUNBUFFERED: '1' },
    detached: process.platform !== 'win32'
  });
  processes.push(aiProc);
  pipeOutput(aiProc.stdout, '[AI Engine]', colors.magenta);
  pipeOutput(aiProc.stderr, '[AI Engine]', colors.magenta);

  // 2. Start Node Backend
  const backendProc = spawn(process.execPath, ['server.js'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: '5000' },
    detached: process.platform !== 'win32'
  });
  processes.push(backendProc);
  pipeOutput(backendProc.stdout, '[Backend]  ', colors.cyan);
  pipeOutput(backendProc.stderr, '[Backend]  ', colors.red);

  // 3. Start Frontend Vite
  const frontendProc = spawn(process.execPath, [viteJs], {
    cwd: FRONTEND_DIR,
    env: { ...process.env },
    detached: process.platform !== 'win32'
  });
  processes.push(frontendProc);
  pipeOutput(frontendProc.stdout, '[Frontend] ', colors.green);
  pipeOutput(frontendProc.stderr, '[Frontend] ', colors.yellow);

  aiProc.on('error', (err) => {
    console.error(`${colors.red}[AI Engine Error]: ${err.message}${colors.reset}`);
  });
  backendProc.on('error', (err) => {
    console.error(`${colors.red}[Backend Error]: ${err.message}${colors.reset}`);
  });
  frontendProc.on('error', (err) => {
    console.error(`${colors.red}[Frontend Error]: ${err.message}${colors.reset}`);
  });
}

startServices();
