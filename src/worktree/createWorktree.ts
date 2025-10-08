#!/usr/bin/env tsx

import yargs from 'yargs';
import { execSync } from 'child_process';
import { join } from 'path';
import { getLocalConfigs } from '../config/getLocalConfigs.js';

interface CreateWorktreeOptions {
    branchName: string;
}

interface Arguments extends CreateWorktreeOptions {
    setupModules?: boolean;
}

function validateCurrentBranch(): void {
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== 'main') {
        throw new Error(`Must be on 'main' branch. Currently on '${currentBranch}'`);
    }
}

function branchExists(branchName: string): boolean {
    try {
        execSync(`git rev-parse --verify ${branchName}`, { encoding: 'utf8' });
        return true;
    } catch {
        return false;
    }
}

export function createWorktree(branchName: string, fromBranch?: string): string {
    if (branchExists(branchName)) {
        throw new Error(`Branch '${branchName}' already exists`);
    }

    const baseBranch = fromBranch || 'origin/main';
    console.log(`Creating branch '${branchName}' from ${baseBranch}...`);
    execSync(`git branch ${branchName} ${baseBranch}`, { stdio: 'inherit' });

    const config = getLocalConfigs();
    const worktreeRootDir = config.worktreeRootDir!;
    const worktreePath = join(worktreeRootDir, branchName);

    execSync(`git worktree add "${worktreePath}" ${branchName}`, { stdio: 'inherit' });

    console.log(`Setting up remote branch '${branchName}'...`);
    execSync(`git -C "${worktreePath}" push -u origin ${branchName}`, { stdio: 'inherit' });

    return worktreePath;
}

export function setupNodeModules(worktreePath: string): void {
    console.log('Installing dependencies...');
    execSync(`pnpm install`, { stdio: 'inherit', cwd: worktreePath });
}

async function parseArguments(): Promise<Arguments> {
    const argv = await yargs(process.argv.slice(2))
        .command('$0 <branchName>', 'Create a new git worktree with the specified branch name', (yargs) => {
            return yargs.positional('branchName', {
                describe: 'Name of the branch to create',
                type: 'string',
                demandOption: true
            });
        })
        .option('setup-modules', {
            describe: 'Run pnpm install in the new worktree',
            type: 'boolean',
            default: true
        })
        .help()
        .argv;

    return {
        branchName: argv.branchName as string,
        setupModules: argv['setup-modules'] as boolean
    };
}

export async function main() {
    const args = await parseArguments();
    
    try {
        validateCurrentBranch();
        
        console.log(`\n📝 Creating worktree for branch '${args.branchName}'...`);
        
        const worktreePath = createWorktree(args.branchName);
        
        if (args.setupModules) {
            setupNodeModules(worktreePath);
        }

        console.log(`✅ Worktree '${args.branchName}' created successfully at ${worktreePath}`);
        return worktreePath;

    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}
