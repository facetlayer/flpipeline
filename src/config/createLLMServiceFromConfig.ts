import { LLMService } from '../hint-db/llm-service.js';
import { OllamaLLMService } from '../hint-db/llm-services/ollama-service.js';
import { ClaudeAgentLLMService } from '../hint-db/llm-services/claude-agent-service.js';
import { LLMProviderConfig } from './ProjectConfig.js';

/**
 * Creates an LLM service instance from project configuration
 *
 * @param config - The LLM provider configuration from project config
 * @returns An instantiated LLM service
 */
export function createLLMServiceFromConfig(config?: LLMProviderConfig): LLMService {
  // Default to Ollama if no config provided
  if (!config) {
    return new OllamaLLMService();
  }

  const provider = config.provider;

  if (provider === 'ollama') {
    return new OllamaLLMService({
      host: config.host,
      defaultModel: config.model
    });
  }

  if (provider === 'claude' || provider === 'claude-agent') {
    return new ClaudeAgentLLMService({
      apiKey: config.apiKey,
      defaultModel: config.model
    });
  }

  // Exhaustive check - this should never be reached
  const _exhaustive: never = provider;
  throw new Error(`Unknown LLM provider: ${provider}`);
}

/**
 * Gets the default model name from configuration or provider defaults
 *
 * @param config - The LLM provider configuration
 * @returns The model name to use
 */
export function getDefaultModelFromConfig(config?: LLMProviderConfig): string | undefined {
  if (!config) {
    return undefined;
  }

  return config.model;
}
