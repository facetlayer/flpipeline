export interface PortConfig {
  name: string;
}

export interface ReplacementConfig {
  filename: string;
  match: string;
  replaceWith: string;
}

export interface UniquePortAssignmentConfig {
  ports: PortConfig[];
  replacements: ReplacementConfig[];
}

export interface WorktreeSetupStep {
  shell?: string;
  copyFiles?: string[];
}

/**
 * LLM provider configuration for Ollama
 */
export interface OllamaLLMConfig {
  provider: 'ollama';
  host?: string;
  model?: string;
}

/**
 * LLM provider configuration for Claude (Anthropic API)
 */
export interface ClaudeLLMConfig {
  provider: 'claude' | 'claude-agent';
  apiKey?: string;
  model?: string;
}

/**
 * Union type of all supported LLM configurations
 */
export type LLMProviderConfig = OllamaLLMConfig | ClaudeLLMConfig;

export interface ProjectConfig {
  localStateDbFilename?: string;
  docsDbFilename?: string;
  worktreeRootDir?: string;
  uniquePortAssignment?: UniquePortAssignmentConfig;
  worktreeSetupSteps?: WorktreeSetupStep[];
  /**
   * LLM provider configuration for operations like hint search.
   * If not specified, defaults to Ollama with default settings.
   */
  llmProvider?: LLMProviderConfig;
  /**
   * Additional paths to search for hint files.
   * These paths are combined with the default flpipeline hints.
   * Supports ~ for home directory expansion.
   */
  hintPaths?: string[];
}