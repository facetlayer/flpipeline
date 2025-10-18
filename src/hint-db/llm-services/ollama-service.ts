import { Ollama } from 'ollama';
import { LLMService, LLMResponse, LLMGenerateOptions } from '../llm-service.js';

/**
 * Configuration options for the Ollama LLM service
 */
export interface OllamaServiceConfig {
  /**
   * The Ollama host URL
   * Defaults to OLLAMA_HOST env var or http://localhost:11434
   */
  host?: string;

  /**
   * Default model to use if not specified in generate options
   * Defaults to 'llama2'
   */
  defaultModel?: string;
}

/**
 * Ollama LLM service implementation
 */
export class OllamaLLMService implements LLMService {
  private ollama: Ollama;
  private defaultModel: string;

  constructor(config?: OllamaServiceConfig) {
    const host = config?.host || process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.defaultModel = config?.defaultModel || 'llama2';
    this.ollama = new Ollama({ host });
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResponse> {
    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.3;

    try {
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          ...(options?.maxTokens && { num_predict: options.maxTokens }),
        }
      });

      return {
        text: response.response.trim(),
        metadata: {
          model: response.model,
          tokensUsed: response.eval_count,
        }
      };
    } catch (error) {
      throw new Error(
        `Ollama generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getProviderName(): string {
    return 'Ollama';
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map(m => m.name);
    } catch (error) {
      throw new Error(
        `Failed to list Ollama models: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
