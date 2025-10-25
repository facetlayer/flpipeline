/**
 * Token pricing information for various LLM models
 * Prices are in USD per million tokens
 */
interface ModelPricing {
  inputPricePerMillion: number;
  outputPricePerMillion: number;
}

/**
 * Pricing data for various models
 * Update these values based on current provider pricing
 */
const MODEL_PRICING: Record<string, ModelPricing> = {
  // Claude models
  'claude-3-5-haiku-20241022': {
    inputPricePerMillion: 1.00,
    outputPricePerMillion: 5.00,
  },
  'claude-3-5-sonnet-20241022': {
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
  },
  'claude-3-opus-20240229': {
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
  },
  // Ollama models are typically free (local)
  'llama2': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
  },
  'llama3': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
  },
  'llama3.1': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
  },
  'llama3.2': {
    inputPricePerMillion: 0,
    outputPricePerMillion: 0,
  },
};

/**
 * Calculate the cost of token usage for a specific model
 * @param model - The model name
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns The cost in USD, or null if pricing is not available
 */
export function calculateTokenCost(
  model: string | undefined,
  inputTokens: number | undefined,
  outputTokens: number | undefined
): number | null {
  if (!model || inputTokens === undefined || outputTokens === undefined) {
    return null;
  }

  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return null;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMillion;

  return inputCost + outputCost;
}

/**
 * Format a cost value as a USD string
 * @param cost - The cost in USD
 * @returns Formatted string like "$0.0012" or "$0.00"
 */
export function formatCost(cost: number): string {
  if (cost === 0) {
    return '$0.00';
  }
  if (cost < 0.0001) {
    return '<$0.0001';
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}
