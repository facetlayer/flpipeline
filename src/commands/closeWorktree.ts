#!/usr/bin/env tsx

import { execSync } from 'child_process';

export async function closeWorktree() {
    try {
        console.log('Closing worktree processes...');
        execSync('candle kill', { 
            stdio: 'inherit',
            encoding: 'utf8'
        });
        console.log('✅ Worktree processes closed successfully');
    } catch (error: any) {
        console.error('❌ Error closing worktree processes:', error.message);
        process.exit(1);
    }
}
