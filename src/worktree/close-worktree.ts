#!/usr/bin/env tsx

import { execSync } from 'child_process';

export async function main() {
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

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}