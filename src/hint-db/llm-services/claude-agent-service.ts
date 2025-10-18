import Anthropic from '@anthropic-ai/sdk';
import { LLMService, LLMResponse, LLMGenerateOptions } from '../llm-service.js';
import { getApiKey } from '../../config/api-keys.js';

/**
 * Configuration options for the Claude service
 */
export interface ClaudeServiceConfig {
  /**
   * Anthropic API key
   * Defaults to ANTHROPIC_API_KEY env var
   */
  apiKey?: string;

  /**
   * Default model to use if not specified in generate options
   * Defaults to 'claude-3-5-haiku-20241022'
   */
  defaultModel?: string;
}

/**
 * Claude API LLM service implementation using Anthropic SDK
 */
export class ClaudeLLMService implements LLMService {
  private anthropic: Anthropic;
  private defaultModel: string;

  constructor(config?: ClaudeServiceConfig) {
    const apiKey = config?.apiKey || getApiKey('ANTHROPIC_API_KEY') || '';

    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is required for Claude service. ' +
        'Set it in .api-keys.json or as an environment variable.'
      );
    }

    this.anthropic = new Anthropic({ apiKey });
    this.defaultModel = config?.defaultModel || 'claude-3-5-haiku-20241022';
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResponse> {
    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.3;
    const maxTokens = options?.maxTokens || 1024;

    try {
      const message = await this.anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }]
      });

      // Extract text from the response
      const textContent = message.content.find(block => block.type === 'text');
      const text = textContent && textContent.type === 'text' ? textContent.text : '';

      return {
        text,
        metadata: {
          model: message.model,
          tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
        }
      };
    } catch (error) {
      throw new Error(
        `Claude API generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getProviderName(): string {
    return 'Claude';
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Try a minimal API call to check availability
      await this.anthropic.messages.create({
        model: this.defaultModel,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export with both names for backward compatibility
export { ClaudeLLMService as ClaudeAgentLLMService };
export type { ClaudeServiceConfig as ClaudeAgentServiceConfig };
