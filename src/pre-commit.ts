#!/usr/bin/env node

import { runShellCommand } from '@facetlayer/subprocess-wrapper';
import path from 'path';
import fs from 'fs';

// Must use process.cwd because of how Git hooks work in worktrees. The root version
// of this script will always be run (not the copy in the worktree).
const PROJECT_ROOT = process.cwd();

async function runFormatStep(stagedFiles: string[]): Promise<boolean> {
  // Define the directories and their source patterns
  const formatTargets = [
    { dir: 'api', pattern: 'api/src/' },
    //{ dir: 'web', pattern: 'web/src/' },
    //{ dir: 'cli-app', pattern: 'cli-app/src/' },
    //{ dir: 'functional-test', pattern: 'functional-test/src/' },
    //{ dir: 'web-functional-test', pattern: 'web-functional-test/src/' }
  ];

  let hasFilesToFormat = false;
  
  for (const target of formatTargets) {
    // Filter files that are in this directory's src and are TypeScript files
    const targetFiles = stagedFiles.filter(file => 
      file.startsWith(target.pattern) && 
      (file.endsWith('.ts') || file.endsWith('.tsx'))
    );

    if (targetFiles.length === 0) {
      continue;
    }

    hasFilesToFormat = true;
    
    // Convert paths to be relative to the target directory (remove prefix)
    const relativeFiles = targetFiles.map(file => file.substring(target.dir.length + 1)); // Remove 'dir/' prefix

    // Filter out files that don't exist (e.g., deleted or renamed files)
    const existingFiles = relativeFiles.filter(file => {
      const fullPath = path.join(PROJECT_ROOT, target.dir, file);
      return fs.existsSync(fullPath);
    });

    if (existingFiles.length === 0) {
      continue;
    }

    // Run pnpm format on the files (using relative paths)
    const formatResult = await runShellCommand('pnpm', ['format:specific-file', ...existingFiles], {
      cwd: path.join(PROJECT_ROOT, target.dir),
      onStdout: (line) => console.log(line),
      onStderr: (line) => console.error(line)
    });

    if (formatResult.failed()) {
      console.error(`Formatting failed in ${target.dir}:`, formatResult.asError().message);
      process.exit(1);
    }
  }

  return hasFilesToFormat;
}

async function main() {
  try {
    // Get the list of files that are staged for commit
    const stagedFilesResult = await runShellCommand('git',
        'diff --cached --name-only'.split(' '), {
      cwd: PROJECT_ROOT,
      enableOutputBuffering: true,
    });

    if (stagedFilesResult.failed()) {
      console.error('Failed to get staged files:', stagedFilesResult.asError().message);
      process.exit(1);
    }

    const stagedFiles = stagedFilesResult.stdout || [];
    
    const hasFilesToFormat = await runFormatStep(stagedFiles);

    if (!hasFilesToFormat) {
      // No files to format, proceed with commit
      process.exit(0);
    }

    // Re-stage all originally staged files that still exist (formatted files will be updated, others unchanged)
    const existingStagedFiles = stagedFiles.filter(file => {
      const fullPath = path.join(PROJECT_ROOT, file);
      return fs.existsSync(fullPath);
    });

    if (existingStagedFiles.length > 0) {
      const addResult = await runShellCommand('git', ['add', ...existingStagedFiles], {
        cwd: PROJECT_ROOT
      });

      if (addResult.failed()) {
        console.error('Failed to re-stage formatted files:', addResult.asError().message);
        process.exit(1);
      }
    }

    console.log('Successfully formatted modified files');
    process.exit(0);

  } catch (error) {
    console.error('Pre-commit hook failed:', error);
    process.exit(1);
  }
}

main();
