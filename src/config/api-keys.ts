import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PROJECT_ROOT_DIR } from '../dirs.js';

/**
 * API keys that can be loaded from file or environment
 */
export interface ApiKeys {
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  [key: string]: string | undefined;
}

/**
 * Load API keys from .api-keys.json file if it exists, otherwise from environment
 *
 * The .api-keys.json file should be in the project root and have this format:
 * {
 *   "ANTHROPIC_API_KEY": "sk-ant-...",
 *   "OPENAI_API_KEY": "sk-..."
 * }
 *
 * IMPORTANT: Add .api-keys.json to .gitignore to keep keys secure!
 */
export function loadApiKeys(): ApiKeys {
  const apiKeysPath = join(PROJECT_ROOT_DIR, '.api-keys.json');

  // Try to load from file first
  if (existsSync(apiKeysPath)) {
    try {
      const fileContent = readFileSync(apiKeysPath, 'utf-8');
      const keysFromFile = JSON.parse(fileContent);

      // Merge with environment variables (env vars take precedence)
      return {
        ...keysFromFile,
        ...(process.env.ANTHROPIC_API_KEY && { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY }),
        ...(process.env.OPENAI_API_KEY && { OPENAI_API_KEY: process.env.OPENAI_API_KEY }),
      };
    } catch (error) {
      console.warn(`Warning: Could not parse .api-keys.json: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fall back to environment variables only
  return {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
}

/**
 * Get a specific API key by name
 */
export function getApiKey(keyName: string): string | undefined {
  const keys = loadApiKeys();
  return keys[keyName];
}
