#!/usr/bin/env tsx

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn, execSync } from 'child_process';
import { runWrappedClaude } from './runWrappedClaude.ts';
import { setupNewWorktree as setupNewWorktree } from '../worktree/setupNewWorktree.ts';

const START_WORK_PROMPT =
    `Read your task instructions below. `
    + `When the task is finished, submit the change as a pull request. This project uses Github Actions. `
    + `All pull requests must pass all build checks in order to be merged. Check the build results after creating the PR. `
    + `After submitting the pull request, run \`flpipeline close-worktree\` to close the locally running processes.\n\n`
    + `Task instructions:`;

function getCurrentBranch(): string {
    try {
        return execSync('git branch --show-current', { 
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        }).toString().trim();
    } catch (error) {
        console.error('Failed to get current branch:', error);
        return 'unknown-branch';
    }
}

function setTerminalTitle(title: string): void {
    // Set terminal title using ANSI escape sequences
    // This works for most modern terminals including iTerm2, Terminal.app, and most Linux terminals
    process.stdout.write(`\x1b]0;${title}\x07`);
}

async function loadTaskInstructions(): Promise<string> {
    const instructionsPath = join(process.cwd(), '.current_task_instructions');
    
    if (!existsSync(instructionsPath)) {
        throw new Error('.current_task_instructions file not found in current directory');
    }
    
    return readFileSync(instructionsPath, 'utf8');
}

export async function annotateInstructions(taskInstructions: string): Promise<string> {
    // RAG functionality has been removed
    return taskInstructions;
}

async function runClaude(prompt: string): Promise<void> {
    console.log('Starting Claude with task instructions...\n');
    
    // Escape the prompt for shell - escape single quotes by replacing ' with '\''
    const escapedPrompt = prompt.replace(/'/g, "'\\''");
    
    // Pass the prompt as a command line argument to claude
    const claudeProcess = spawn('sh', ['-c', `claude --permission-mode acceptEdits '${escapedPrompt}'`], {
        stdio: 'inherit',
        shell: false
    });
    
    return new Promise((resolve, reject) => {
        claudeProcess.on('error', (error) => {
            reject(new Error(`Failed to start Claude: ${error.message}`));
        });
        
        claudeProcess.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Claude exited with code ${code}`));
            }
        });
    });
}

async function buildFullPrompt(): Promise<string> {
    const taskInstructions = await loadTaskInstructions();

    const annotatedTaskInstructions = await annotateInstructions(taskInstructions);
    
    // Build the full prompt, optionally augmented by doc RAG
    const fullPrompt = START_WORK_PROMPT + '\n\n' + annotatedTaskInstructions;

    return fullPrompt;
}

export async function runTaskInWorktree() {
    try {
        // Parse command line arguments
        const useAutotrust = process.argv.includes('--autotrust');
        
        await setupNewWorktree();
        
        // Set terminal title to current branch
        const currentBranch = getCurrentBranch();
        setTerminalTitle(currentBranch);
        console.log(`Terminal title set to: ${currentBranch}`);
        
        // Build task instructions
        const fullPrompt = await buildFullPrompt();
        
        // Run Claude with the appropriate mode
        if (useAutotrust) {
            await runWrappedClaude(fullPrompt);
        } else {
            await runClaude(fullPrompt);
        }
        
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
