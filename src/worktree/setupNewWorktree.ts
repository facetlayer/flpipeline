#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { copyFileSync, existsSync } from 'fs';
import { join, resolve, relative } from 'path';
import { runShellCommand } from '@facetlayer/subprocess-wrapper';
import { assignNewPorts } from './uniquePortAssignment.js';
import { getLocalConfigs } from '../config/getLocalConfigs.js';
import { setupClaudeSettings } from './setupClaudeSettings.js';

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

async function runSetupSteps(originalRepoPath: string): Promise<void> {
  const config = getLocalConfigs();

  if (!config.worktreeSetupSteps || config.worktreeSetupSteps.length === 0) {
    console.log('No worktree setup steps configured, using defaults');
    // Default: copy env files and run pnpm install
    const defaultFiles = ['web/.env', 'api/.env', 'cli-app/.env', 'tools/doc-rag/docs.db'];
    for (const filePath of defaultFiles) {
      const sourceFilePath = join(originalRepoPath, filePath);
      const targetFilePath = join(process.cwd(), filePath);
      if (existsSync(sourceFilePath)) {
        copyFileSync(sourceFilePath, targetFilePath);
        console.log(`Copied ${filePath}`);
      }
    }

    await runShellCommand('pnpm install', [], {
      shell: true,
      cwd: process.cwd(),
      onStdout: (line) => {
        console.log(`setup: ${line}`);
      },
      onStderr: (line) => {
        console.error(`setup: ${line}`);
      }
    });
    return;
  }

  for (const step of config.worktreeSetupSteps) {
    // Handle file copying
    if (step.copyFiles) {
      console.log(`Copying files: ${step.copyFiles.join(', ')}`);
      for (const filePath of step.copyFiles) {
        const sourceFilePath = join(originalRepoPath, filePath);
        const targetFilePath = join(process.cwd(), filePath);

        if (existsSync(sourceFilePath)) {
          copyFileSync(sourceFilePath, targetFilePath);
          console.log(`Copied ${filePath}`);
        } else {
          console.warn(`Source file not found: ${sourceFilePath}`);
        }
      }
    }

    // Handle shell command
    if (step.shell) {
      console.log(`Running setup step: ${step.shell}`);
      try {
        await runShellCommand(step.shell, [], {
          shell: true,
          cwd: process.cwd(),
          onStdout: (line) => {
            console.log(`setup: ${line}`);
          },
          onStderr: (line) => {
            console.error(`setup: ${line}`);
          }
        });
        console.log(`Setup step completed: ${step.shell}`);
      } catch (error) {
        console.error(`Setup step failed: ${step.shell}`, error);
        throw error;
      }
    }
  }
}

export async function setupNewWorktree() {
  console.log('Setting up new worktree...');

  // Check if we're on the main branch and exit if so
  const currentBranch = runCommand('git branch --show-current');
  if (currentBranch === 'main') {
    console.error('Error: Cannot run worktree preparation on the main branch');
    process.exit(1);
  }

  const originalRepoPath = findOriginalRepoPath();

  await runSetupSteps(originalRepoPath);

  await assignNewPorts();

  await setupClaudeSettings();

  console.log('Worktree preparation complete!');
}

// Check if this script is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupNewWorktree().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
