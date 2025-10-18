import { LLMService, LLMResponse, LLMGenerateOptions } from '../llm-service.js';

/**
 * Configuration options for the Claude Agent SDK service
 */
export interface ClaudeAgentServiceConfig {
  /**
   * Anthropic API key
   * Defaults to ANTHROPIC_API_KEY env var
   */
  apiKey?: string;

  /**
   * Default model to use if not specified in generate options
   * Defaults to 'claude-sonnet-4-5-20250929'
   */
  defaultModel?: string;
}

/**
 * Claude Agent SDK LLM service implementation
 *
 * NOTE: This is a placeholder implementation for future use with the Claude Agent SDK.
 * To complete this implementation:
 * 1. Install: pnpm add @anthropic-ai/sdk
 * 2. Import Anthropic SDK
 * 3. Implement the generate method using the SDK's messages API
 *
 * For now, this will throw an error if used.
 */
export class ClaudeAgentLLMService implements LLMService {
  private apiKey: string;
  private defaultModel: string;

  constructor(config?: ClaudeAgentServiceConfig) {
    this.apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.defaultModel = config?.defaultModel || 'claude-sonnet-4-5-20250929';

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for Claude Agent service');
    }
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResponse> {
    throw new Error(
      'Claude Agent SDK service is not yet implemented. ' +
      'Please install @anthropic-ai/sdk and implement this service, or use OllamaLLMService instead.'
    );

    // Future implementation will look something like:
    /*
    import Anthropic from '@anthropic-ai/sdk';

    const anthropic = new Anthropic({ apiKey: this.apiKey });
    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.3;

    const message = await anthropic.messages.create({
      model,
      max_tokens: options?.maxTokens || 1024,
      temperature,
      messages: [{ role: 'user', content: prompt }]
    });

    return {
      text: message.content[0].type === 'text' ? message.content[0].text : '',
      metadata: {
        model: message.model,
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      }
    };
    */
  }

  getProviderName(): string {
    return 'Claude Agent SDK';
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }
}
