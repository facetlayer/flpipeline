/**
 * Response from an LLM service
 */
export interface LLMResponse {
  /**
   * The generated text response
   */
  text: string;

  /**
   * Optional metadata about the response
   */
  metadata?: {
    model?: string;
    tokensUsed?: number;
    [key: string]: any;
  };
}

/**
 * Options for generating text with an LLM
 */
export interface LLMGenerateOptions {
  /**
   * The model to use for generation
   */
  model?: string;

  /**
   * Temperature for generation (0.0 to 1.0)
   * Lower values = more deterministic
   * Higher values = more creative
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   */
  maxTokens?: number;

  /**
   * Additional provider-specific options
   */
  [key: string]: any;
}

/**
 * Abstract interface for LLM service providers
 * This allows easy swapping between different LLM providers (Ollama, Claude, OpenAI, etc.)
 */
export interface LLMService {
  /**
   * Generate text based on a prompt
   * @param prompt - The prompt to send to the LLM
   * @param options - Optional generation parameters
   * @returns The LLM's response
   */
  generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResponse>;

  /**
   * Get the name of this LLM service provider
   */
  getProviderName(): string;

  /**
   * Check if the service is available/healthy
   */
  isAvailable(): Promise<boolean>;
}
