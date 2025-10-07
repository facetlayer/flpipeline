import fs from 'fs';
import path from 'path';
import { MissingConfigFileError } from '../errors.js';

const CONFIG_FILE_NAME = '.flpipeline.json';

export function findConfigFile(startDir: string = process.cwd()): string {
  const searchPaths: string[] = [];

  let currentDir = path.resolve(startDir);
  const rootDir = path.parse(currentDir).root;

  while (true) {
    const configPath = path.join(currentDir, CONFIG_FILE_NAME);
    searchPaths.push(configPath);

    try {
      if (fs.existsSync(configPath) && fs.statSync(configPath).isFile()) {
        return configPath;
      }
    } catch (error) {
      // Continue searching if we can't access this directory
    }

    // If we've reached the filesystem root, stop searching
    if (currentDir === rootDir) {
      break;
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);

    // Safety check to prevent infinite loops
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  throw new MissingConfigFileError(searchPaths);
}