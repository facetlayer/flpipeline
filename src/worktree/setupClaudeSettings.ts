import { updateClaudeSettings } from '../utils/updateClaudeSettings.js';

/**
 * Default permissions to grant to Claude in new worktrees.
 * These allow Claude to perform common development tasks without prompting.
 */
const DEFAULT_CLAUDE_PERMISSIONS = [
  'Bash(npm run build:*)',
  'Bash(git add:*)',
  'Bash(git commit:*)',
  'Bash(git push:*)',
  'Bash(gh pr create:*)',
  'Bash(gh pr:*)'
];

/**
 * Sets up Claude settings for the current worktree by adding default permissions.
 * Creates .claude/settings.local.json if it doesn't exist.
 */
export async function setupClaudeSettings(): Promise<void> {
  console.log('Setting up Claude settings...');
  updateClaudeSettings(DEFAULT_CLAUDE_PERMISSIONS);
  console.log('Claude settings configured');
}
