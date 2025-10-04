import { readFileSync } from 'fs';
import { homedir } from 'os';
import { findConfigFile } from './findConfigFile.js';
import { ProjectConfig } from './ProjectConfig.js';

export function getLocalConfigs(startDir?: string): ProjectConfig {
    try {
        const configPath = findConfigFile(startDir);
        const configContent = readFileSync(configPath, 'utf8');
        const config: ProjectConfig = JSON.parse(configContent);

        // Apply defaults
        const worktreeRootDir = config.worktreeRootDir || '~/work';

        // Handle ~ for home directory
        const expandedWorktreeRootDir = worktreeRootDir.startsWith('~')
            ? worktreeRootDir.replace('~', homedir())
            : worktreeRootDir;

        return {
            ...config,
            worktreeRootDir: expandedWorktreeRootDir
        };
    } catch (error) {
        // If config file not found, return defaults
        return {
            worktreeRootDir: `${homedir()}/work`
        };
    }
}
