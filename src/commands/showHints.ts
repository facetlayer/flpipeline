import matter from 'gray-matter';
import { getRelevantHints } from '../hint-db/getRelevantHints.js';
import { getLocalConfigs } from '../config/getLocalConfigs.js';
import { createLLMServiceFromConfig, getDefaultModelFromConfig } from '../config/createLLMServiceFromConfig.js';
import { getHintPatterns } from '../hint-db/getHintPatterns.js';

export interface ShowHintsArgs {
  query: string;
  limit?: number;
  model?: string;
  temperature?: number;
}

/**
 * Search for relevant hint files and display their full content
 */
export async function showHints(args: ShowHintsArgs): Promise<void> {
  const {
    query,
    limit = 5,
    model,
    temperature = 0.3
  } = args;

  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required');
  }

  try {
    // Load project configuration
    const config = getLocalConfigs(process.cwd());

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

    // Get hint patterns (includes default + project-specific)
    const patterns = getHintPatterns(config);

    // Get relevant hints
    const foundHints = await getRelevantHints(query, {
      patterns,
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

    // Get all hint contents
    const hintContents = foundHints.getAllHintContents();

    // For each hint, display its full content
    for (const { name, content: fileContent } of hintContents) {
      try {
        // Parse frontmatter
        const { data, content } = matter(fileContent);

        console.log('─'.repeat(80));
        console.log(`\nHint: ${name}`);
        if (data.description) {
          console.log(`${data.description}`);
        }
        if (data.relevant_for) {
          console.log(`Relevant for: ${data.relevant_for}`);
        }
        console.log('\n' + '─'.repeat(80));
        console.log(content.trim());
        console.log('─'.repeat(80) + '\n');

      } catch (error) {
        console.warn(`Warning: Could not parse hint ${name}:`, error);
      }
    }

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to show hints: ${error.message}`);
    }
    throw error;
  }
}
