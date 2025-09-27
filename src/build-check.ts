#!/usr/bin/env tsx

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

interface CheckConfig {
  name: string;
  command: string;
  cwd: string;
  env?: Record<string, string>;
}

const CHECK_STEPS: CheckConfig[] = [
  {
    name: 'api-clients',
    command: './bin/generate-api-clients --check-only',
    cwd: '.'
  },
  {
    name: 'api:test',
    command: 'pnpm test',
    cwd: 'api'
  },
  {
    name: 'api:typecheck',
    command: 'pnpm typecheck',
    cwd: 'api'
  },
  {
    name: 'web-functional-test',
    command: 'pnpm test:stable',
    cwd: 'web-functional-test',
  },
  {
    name: 'web-functional-test:typecheck',
    command: 'pnpm typecheck',
    cwd: 'web-functional-test'
  },
];

const CHECKS = CHECK_STEPS.map(config => config.name);

function stopCandle(): void {
  try {
    execSync('candle kill', { cwd: PROJECT_ROOT, stdio: 'pipe' });
    console.log('Stopped candle services');
  } catch (error) {
    console.log('Candle services were not running or already stopped');
  }
}

function startServices(): void {
  try {
    console.log('Starting API and Web services...');
    execSync('candle start api web', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    
    execSync('candle wait-for-log api --message "now listening"', { 
      cwd: PROJECT_ROOT, 
      stdio: 'inherit',
      timeout: 30000
    });
    execSync('candle wait-for-log web --message "Ready"', { 
      cwd: PROJECT_ROOT, 
      stdio: 'inherit',
      timeout: 30000
    });
    
    console.log('Services are ready');
  } catch (error) {
    console.error('Error starting services:', error);
    throw error;
  }
}

function runCheck(checkName: string): { passed: boolean; log: string } {
  const config = CHECK_STEPS.find(c => c.name === checkName);
  if (!config) {
    throw new Error(`Unknown check: ${checkName}`);
  }
  
  let log = '';
  let passed = false;
  
  try {
    console.log(`Running check: ${checkName}`);
    
    const env = config.env ? { ...process.env, ...config.env } : process.env;
    
    log = execSync(config.command, { 
      cwd: path.join(PROJECT_ROOT, config.cwd), 
      encoding: 'utf-8',
      stdio: 'pipe',
      env
    });
    passed = true;
  } catch (error: any) {
    passed = false;
    if (error.stdout) {
      log += error.stdout;
    }
    if (error.stderr) {
      log += '\n' + error.stderr;
    }
    if (!log && error.message) {
      log = error.message;
    }
  }
  
  return { passed, log };
}

async function runBuildChecks() {
  console.log('Running build checks...');
  
  // Restart the related services
  stopCandle();
  startServices();
  
  // Run all checks serially
  for (const checkName of CHECKS) {
    console.log(`\n--- Running ${checkName} ---`);
    
    const { passed, log } = runCheck(checkName);
    
    console.log(`${passed ? '✓' : '✗'} ${checkName}: ${passed ? 'PASS' : 'FAIL'}`);
    
    if (!passed) {
      console.log(`\n❌ ${checkName} failed. Stopping execution.`);
      if (log) {
        console.log(`\n--- Error Log ---`);
        console.log(log);
      }
      process.exit(1);
    }
  }
  
  console.log('\n🎉 All checks passed!');
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBuildChecks().catch((error) => {
    console.error('Error running build checks:', error);
    process.exit(1);
  });
}
