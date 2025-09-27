#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { copyFileSync, existsSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve, relative } from 'path';
import { runShellCommand } from '@facetlayer/subprocess-wrapper';
import { changeAssignedPort } from '../workflow/change-assigned-port';

const COPY_FILES_FROM_ORIGINAL_REPO = [
  'web/.env',
  'api/.env',
  'cli-app/.env',
  'tools/doc-rag/docs.db',
];

function runCommand(command: string, cwd?: string): string {
  try {
    return execSync(command, { 
      cwd, 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).toString().trim();
  } catch (error) {
    console.error(`Failed to run command: ${command}`);
    throw error;
  }
}

function validatePath(path: string, description: string): string {
  if (!path || path.trim() === '') {
    throw new Error(`Invalid ${description}: path is empty`);
  }
  
  const resolvedPath = resolve(path);
  
  // Check for suspicious path patterns
  if (path.includes('..') && relative(process.cwd(), resolvedPath).startsWith('..')) {
    throw new Error(`Invalid ${description}: path contains suspicious traversal patterns`);
  }
  
  return resolvedPath;
}

function validateGitOutput(output: string): string {
  if (!output || output.trim() === '') {
    throw new Error('Git command returned empty output');
  }
  
  // Basic validation that the output looks like a valid path
  const trimmed = output.trim();
  if (trimmed.includes('\n') || trimmed.includes('\r')) {
    throw new Error('Git command returned unexpected multi-line output');
  }
  
  return trimmed;
}

function findOriginalRepoPath(): string {
  console.log('Finding original repo path...');
  const gitCommonDir = runCommand('git rev-parse --path-format=absolute --git-common-dir');
  
  const validatedGitOutput = validateGitOutput(gitCommonDir);
  const validatedGitCommonDir = validatePath(validatedGitOutput, 'git common directory');
  const originalRepoPath = validatePath(join(validatedGitCommonDir, '..'), 'original repository path');
  
  console.log(`Original repo path: ${originalRepoPath}`);
  return originalRepoPath;
}

function copyEnvFiles(originalRepoPath: string): void {
  // Copy required files from original repo to current repo
  for (const filePath of COPY_FILES_FROM_ORIGINAL_REPO) {
    const sourceFilePath = join(originalRepoPath, filePath);
    const targetFilePath = join(process.cwd(), filePath);

    if (existsSync(sourceFilePath)) {
      copyFileSync(sourceFilePath, targetFilePath);
    } else {
      console.warn(`Source file not found at ${sourceFilePath}`);
    }
  }
}

function updateBaseUrlsInEnvFile(filePath: string, apiPort: number, webPort: number): void {
  if (!existsSync(filePath)) {
    console.warn(`Env file not found: ${filePath}`);
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  let updatedContent = content;

  // Update API_BASE_URL:
  updatedContent = updatedContent.replace(
    /^API_BASE_URL=http:\/\/localhost:\d+$/gm,
    `API_BASE_URL=http://localhost:${apiPort}`
  );

  // Update WEB_BASE_URL:
  updatedContent = updatedContent.replace(
    /^WEB_BASE_URL=http:\/\/localhost:\d+$/gm,
    `WEB_BASE_URL=http://localhost:${webPort}`
  );

  // Update NEXT_PUBLIC_API_URL
  updatedContent = updatedContent.replace(
    /^NEXT_PUBLIC_API_URL=http:\/\/localhost:\d+$/gm,
    `NEXT_PUBLIC_API_URL=http://localhost:${apiPort}`
  );

  // Update MCP_EVAL_API_URL:
  updatedContent = updatedContent.replace(
    /^MCP_EVAL_API_URL=http:\/\/localhost:\d+$/gm,
    `MCP_EVAL_API_URL=http://localhost:${apiPort}`
  );

  if (updatedContent !== content) {
    writeFileSync(filePath, updatedContent, 'utf8');
  }
}

function assignNewPorts(): void {
  console.log('Assigning new ports...');
  
  // Get new port for web
  const webPortOutput = runCommand('port-assign --next');
  const webPort = parseInt(webPortOutput.trim(), 10);
  if (isNaN(webPort)) {
    throw new Error(`Invalid port from port-assign for web: ${webPortOutput}`);
  }
  console.log(`Assigning port ${webPort} to web`);
  changeAssignedPort('web', webPort);
  
  // Get new port for api
  const apiPortOutput = runCommand('port-assign --next');
  const apiPort = parseInt(apiPortOutput.trim(), 10);
  if (isNaN(apiPort)) {
    throw new Error(`Invalid port from port-assign for api: ${apiPortOutput}`);
  }
  console.log(`Assigning port ${apiPort} to api`);
  changeAssignedPort('api', apiPort);

  // Update base URLs in .env files
  for (const envFile of COPY_FILES_FROM_ORIGINAL_REPO) {
    const envFilePath = join(process.cwd(), envFile);
    updateBaseUrlsInEnvFile(envFilePath, apiPort, webPort);
  }
}

async function runInstall(): Promise<void> {
  console.log('Running pnpm install to fix binary dependencies...');
  try {
    await runShellCommand('pnpm install', [], { 
      shell: true,
      cwd: process.cwd(),
      onStdout: (line) => {
        console.log(`pnpm-install: ${line}`);
      },
      onStderr: (line) => {
        console.error(`pnpm-install: ${line}`);
      }
    });
    console.log('Yarn install completed successfully');
  } catch (error) {
    console.error('Yarn install failed:', error);
    throw error;
  }
}

export async function main() {
  console.log('Preparing worktree...');

  // Check if we're on the main branch and exit if so
  const currentBranch = runCommand('git branch --show-current');
  if (currentBranch === 'main') {
    console.error('Error: Cannot run worktree preparation on the main branch');
    process.exit(1);
  }

  const originalRepoPath = findOriginalRepoPath();

  console.log('Copying env files...');
  copyEnvFiles(originalRepoPath);

  await runInstall();
  
  assignNewPorts();

  console.log('Worktree preparation complete!');
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
