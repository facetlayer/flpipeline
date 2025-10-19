import { join } from 'path';
import { PROJECT_ROOT_DIR } from '../dirs.js';
import { ProjectConfig } from '../config/ProjectConfig.js';

/**
 * Get glob patterns for hint file discovery.
 * Always includes the default flpipeline hints, plus any configured project-specific hints.
 *
 * @param config - Optional project configuration
 * @returns Array of glob patterns to search for hint files
 */
export function getHintPatterns(config?: ProjectConfig): string[] {
  const patterns: string[] = [];

  // Always include the default flpipeline hints
  patterns.push(join(PROJECT_ROOT_DIR, 'src/hints/**/*.md'));

  // Add any project-specific hint paths from config
  if (config?.hintPaths) {
    for (const hintPath of config.hintPaths) {
      // If path ends with .md, use as-is, otherwise add /**/*.md
      if (hintPath.endsWith('.md')) {
        patterns.push(hintPath);
      } else {
        patterns.push(join(hintPath, '**/*.md'));
      }
    }
  }

  return patterns;
}
