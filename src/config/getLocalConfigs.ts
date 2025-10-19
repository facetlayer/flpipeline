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

        // Expand ~ in hintPaths if present
        const expandedHintPaths = config.hintPaths?.map(path =>
            path.startsWith('~') ? path.replace('~', homedir()) : path
        );

        return {
            ...config,
            worktreeRootDir: expandedWorktreeRootDir,
            docsDbFilename: config.docsDbFilename || '.docs.db',
            hintPaths: expandedHintPaths
        };
    } catch (error) {
        // If config file not found, return defaults
        return {
            worktreeRootDir: `${homedir()}/work`,
            docsDbFilename: '.docs.db'
        };
    }
}
