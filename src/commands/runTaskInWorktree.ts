import { runTaskInWorktree } from '../workflow/runTaskInWorktree.ts';

export async function runTaskInWorktreeCommand(): Promise<void> {
    await runTaskInWorktree();
}
