import { getRelevantHints } from '../hint-db/getRelevantHints.js';
import { join } from 'path';
import { PROJECT_ROOT_DIR } from '../dirs.js';
import { getLocalConfigs } from '../config/getLocalConfigs.js';
import { createLLMServiceFromConfig, getDefaultModelFromConfig } from '../config/createLLMServiceFromConfig.js';

export interface SearchHintsArgs {
  query: string;
  limit?: number;
  model?: string;
  temperature?: number;
  showContent?: boolean;
}

/**
 * Search for relevant hint files based on a query
 */
export async function searchHints(args: SearchHintsArgs): Promise<void> {
  const {
    query,
    limit = 5,
    model,
    temperature = 0.3,
    showContent = false
  } = args;

  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required');
  }

  try {
    // Load project configuration
    const config = getLocalConfigs(PROJECT_ROOT_DIR);

    // Initialize the LLM service from configuration
    const llmService = createLLMServiceFromConfig(config.llmProvider);

    // Get the model: CLI arg > config > service default
    const modelToUse = model || getDefaultModelFromConfig(config.llmProvider);

    // Check if the service is available
    const isAvailable = await llmService.isAvailable();
    if (!isAvailable) {
      const providerName = llmService.getProviderName();
      throw new Error(
        `${providerName} service is not available. Please ensure ${providerName} is running and configured properly.`
      );
    }

    // Get relevant hints
    const foundHints = await getRelevantHints(query, {
      patterns: [join(PROJECT_ROOT_DIR, 'src/hints/**/*.md')],
      llmService,
      maxHints: limit,
      temperature,
      model: modelToUse
    });

    if (!foundHints.hasHints()) {
      console.log('No relevant hints found for your query.');
      return;
    }

    console.log(`Found ${foundHints.getCount()} relevant hint file(s):\n`);

    // Display the results
    const hintNames = foundHints.getHintNames();
    hintNames.forEach((hintName, index) => {
      console.log(`${index + 1}. ${hintName}`);
    });

    // Optionally show content
    if (showContent) {
      console.log('\n' + '='.repeat(80) + '\n');

      hintNames.forEach((hintName, index) => {
        if (index > 0) {
          console.log('\n' + '-'.repeat(80) + '\n');
        }

        console.log(`Hint ${index + 1}: ${hintName}\n`);

        try {
          const content = foundHints.getHintContent(hintName);
          console.log(content);
        } catch (error) {
          console.error(`Error reading hint content: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
    } else {
      console.log('\nUse --show-content to display the full content of the hints.');
    }

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to search hints: ${error.message}`);
    }
    throw error;
  }
}
