import { readFileSync } from 'fs';
import { basename, join } from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';
import { PROJECT_ROOT_DIR } from '../dirs.js';

/**
 * Options for the getListing function
 */
export interface GetListingOptions {
  /**
   * Glob patterns to search for hint files.
   * Defaults to src/hints with ** wildcard for all .md files relative to PROJECT_ROOT_DIR
   */
  patterns?: string[];
}

/**
 * Detailed hint information
 */
export interface HintInfo {
  name: string;
  description: string;
  relevant_for?: string;
}

/**
 * Reads all markdown files matching the specified glob patterns and extracts their frontmatter
 * to create a listing of available hints.
 *
 * @param options - Configuration options for finding and listing hint files
 * @returns Array of hint information objects
 */
export async function getListing(options?: GetListingOptions): Promise<HintInfo[]> {
  const defaultPatterns = [join(PROJECT_ROOT_DIR, 'src/hints/**/*.md')];
  const patterns = options?.patterns ?? defaultPatterns;

  const hintInfos: HintInfo[] = [];
  const processedFiles = new Set<string>();

  try {
    // Process each glob pattern
    for (const pattern of patterns) {
      const files = await glob(pattern, { nodir: true });

      for (const filePath of files) {
        // Skip if we've already processed this file (in case of overlapping patterns)
        if (processedFiles.has(filePath)) {
          continue;
        }
        processedFiles.add(filePath);

        try {
          // Read the file content
          const fileContent = readFileSync(filePath, 'utf-8');

          // Parse frontmatter
          const { data } = matter(fileContent);

          // Extract name (from filename without extension) and description
          const name = basename(filePath, '.md');
          const description = data.description || 'No description available';
          const relevant_for = data.relevant_for;

          hintInfos.push({
            name,
            description,
            ...(relevant_for && { relevant_for })
          });
        } catch (error) {
          // If there's an error reading or parsing a specific file, log it and continue
          console.warn(`Warning: Could not process file ${filePath}:`, error);
        }
      }
    }

    // Sort alphabetically by name
    hintInfos.sort((a, b) => a.name.localeCompare(b.name));

  } catch (error) {
    console.error(`Error processing glob patterns:`, error);
    throw error;
  }

  return hintInfos;
}
