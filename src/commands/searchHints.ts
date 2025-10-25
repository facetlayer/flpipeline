import { getRelevantHints } from '../hint-db/getRelevantHints.js';
import { getLocalConfigs } from '../config/getLocalConfigs.js';
import { createLLMServiceFromConfig, getDefaultModelFromConfig } from '../config/createLLMServiceFromConfig.js';
import { getHintPatterns } from '../hint-db/getHintPatterns.js';
import { calculateTokenCost, formatCost } from '../hint-db/token-costs.js';

export interface SearchHintsArgs {
  query: string;
  limit?: number;
  model?: string;
  temperature?: number;
}

/**
 * Search for relevant hint files based on a query
 */
export async function searchHints(args: SearchHintsArgs): Promise<void> {
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

    // Display the results
    const hintNames = foundHints.getHintNames();
    hintNames.forEach((hintName, index) => {
      console.log(`${index + 1}. ${hintName}`);
    });

    console.log('\nUse "flpipeline show-hints" to display the full content of all hints.');

    // Display token usage information if available
    const tokenUsage = foundHints.getTokenUsage();
    if (tokenUsage) {
      const cost = calculateTokenCost(tokenUsage.model, tokenUsage.inputTokens, tokenUsage.outputTokens);
      if (cost !== null) {
        console.log(`Token Usage: ${formatCost(cost)}`);
      } else if (tokenUsage.tokensUsed !== undefined) {
        console.log(`Token Usage: ${tokenUsage.tokensUsed.toLocaleString()} tokens`);
      }
    }

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to search hints: ${error.message}`);
    }
    throw error;
  }
}
