import { readFileSync } from 'fs';
import { join, relative } from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';
import { getListing } from '../hint-db/getListing.js';
import { getLocalConfigs } from '../config/getLocalConfigs.js';
import { getHintPatterns } from '../hint-db/getHintPatterns.js';
import { PROJECT_ROOT_DIR } from '../dirs.js';

export interface ShowHintsArgs {
  // Currently no arguments, but keeping for future extensibility
}

/**
 * Display all available hint files with their full content
 */
export async function showHints(args?: ShowHintsArgs): Promise<void> {
  try {
    // Load project configuration
    const config = getLocalConfigs(process.cwd());

    // Get hint patterns (includes default + project-specific)
    const patterns = getHintPatterns(config);

    // Get all hints
    const hintInfos = await getListing({ patterns });

    if (hintInfos.length === 0) {
      console.log('No hint files found.');
      return;
    }

    console.log(`Found ${hintInfos.length} hint file(s):\n`);

    // For each hint, read and display the full content
    const processedFiles = new Set<string>();

    for (const pattern of patterns) {
      const files = await glob(pattern, { nodir: true });

      for (const filePath of files) {
        if (processedFiles.has(filePath)) {
          continue;
        }
        processedFiles.add(filePath);

        try {
          // Read the file content
          const fileContent = readFileSync(filePath, 'utf-8');
          const { data, content } = matter(fileContent);

          // Find matching hint info for name and description
          const hintInfo = hintInfos.find(h =>
            filePath.endsWith(`${h.name}.md`)
          );

          if (!hintInfo) continue;

          // Get relative path from current working directory
          const relativePath = relative(process.cwd(), filePath);

          console.log('─'.repeat(80));
          console.log(`\nFile: ${relativePath}`);
          console.log(`${hintInfo.name}`);
          console.log(`${hintInfo.description}`);
          if (hintInfo.relevant_for) {
            console.log(`Relevant for: ${hintInfo.relevant_for}`);
          }
          console.log('\n' + '─'.repeat(80));
          console.log(content.trim());
          console.log('─'.repeat(80) + '\n');

        } catch (error) {
          console.warn(`Warning: Could not read file ${filePath}:`, error);
        }
      }
    }

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to show hints: ${error.message}`);
    }
    throw error;
  }
}
