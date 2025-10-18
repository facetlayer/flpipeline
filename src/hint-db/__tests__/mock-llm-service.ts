import { LLMService, LLMResponse, LLMGenerateOptions } from '../llm-service.js';

/**
 * Mock LLM service for testing purposes
 * Allows controlling the response for predictable tests
 */
export class MockLLMService implements LLMService {
  private mockResponse: string;
  private shouldFail: boolean;

  constructor(mockResponse: string = '["test-hint-1", "test-hint-2"]', shouldFail: boolean = false) {
    this.mockResponse = mockResponse;
    this.shouldFail = shouldFail;
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResponse> {
    if (this.shouldFail) {
      throw new Error('Mock LLM service failure');
    }

    return {
      text: this.mockResponse,
      metadata: {
        model: options?.model || 'mock-model',
        tokensUsed: 100,
      }
    };
  }

  getProviderName(): string {
    return 'MockLLM';
  }

  async isAvailable(): Promise<boolean> {
    return !this.shouldFail;
  }

  /**
   * Update the mock response for subsequent calls
   */
  setMockResponse(response: string): void {
    this.mockResponse = response;
  }

  /**
   * Set whether the service should fail
   */
  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }
}
