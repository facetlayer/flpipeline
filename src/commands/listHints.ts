import { getListing } from '../hint-db/getListing.js';
import { getLocalConfigs } from '../config/getLocalConfigs.js';
import { getHintPatterns } from '../hint-db/getHintPatterns.js';

export interface ListHintsArgs {
  verbose?: boolean;
}

/**
 * List all available hint files
 */
export async function listHints(args?: ListHintsArgs): Promise<void> {
  const { verbose = false } = args || {};

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

    if (verbose) {
      // Show detailed information including descriptions
      hintInfos.forEach((hint, index) => {
        console.log(`${index + 1}. ${hint.name}`);
        console.log(`   ${hint.description}`);
        if (hint.relevant_for) {
          console.log(`   Relevant for: ${hint.relevant_for}`);
        }
        if (index < hintInfos.length - 1) {
          console.log('');
        }
      });
    } else {
      // Simple list of names
      hintInfos.forEach((hint, index) => {
        console.log(`${index + 1}. ${hint.name}`);
      });
      console.log('\nUse --verbose to see descriptions and relevance criteria.');
      console.log('Use "flpipeline show-hints" to see full content of all hints.');
    }

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to list hints: ${error.message}`);
    }
    throw error;
  }
}
