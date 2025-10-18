# Hint Database

This module provides functionality for managing and querying hint files using LLM-powered relevance matching.

## Overview

- **getListing**: Read and list all hint files with their descriptions
- **getRelevantHints**: Use an LLM to find the most relevant hints for a given query
- **FoundHints**: Class for accessing and working with discovered hint files
- **LLM Service Plugins**: Pluggable architecture for different LLM providers

## Usage

### Basic Usage with Default (Ollama)

```typescript
import { getRelevantHints } from './hint-db/getRelevantHints.js';

// Find relevant hints using default Ollama service
const foundHints = await getRelevantHints(
  'I need to set up a new Next.js project'
);

// Access the results
console.log(`Found ${foundHints.getCount()} hints`);
foundHints.forEach(hintName => {
  console.log(`- ${hintName}`);
});

// Get full content of a specific hint
const content = foundHints.getHintContent('new-project-setup-nextjs');

// Get all hint contents
const allContents = foundHints.getAllHintContents();
```

### Using Different LLM Services

The module uses a plugin architecture that makes it easy to swap LLM providers:

#### Using Ollama (Default)

```typescript
import { getRelevantHints } from './hint-db/getRelevantHints.js';
import { OllamaLLMService } from './hint-db/llm-services/index.js';

const llmService = new OllamaLLMService({
  host: 'http://localhost:11434',
  defaultModel: 'llama2'
});

const foundHints = await getRelevantHints('Setup a TypeScript project', {
  llmService,
  maxHints: 3
});
```

#### Using Claude Agent SDK (Future)

```typescript
import { getRelevantHints } from './hint-db/getRelevantHints.js';
import { ClaudeAgentLLMService } from './hint-db/llm-services/index.js';

// First, install the Anthropic SDK:
// pnpm add @anthropic-ai/sdk

// Then implement the ClaudeAgentLLMService (see claude-agent-service.ts)

const llmService = new ClaudeAgentLLMService({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultModel: 'claude-sonnet-4-5-20250929'
});

const foundHints = await getRelevantHints('Write React best practices', {
  llmService,
  temperature: 0.5,
  maxHints: 5
});
```

### Creating a Custom LLM Service

You can easily create your own LLM service by implementing the `LLMService` interface:

```typescript
import { LLMService, LLMResponse, LLMGenerateOptions } from './hint-db/llm-service.js';

class MyCustomLLMService implements LLMService {
  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResponse> {
    // Your implementation here
    const response = await yourLLMProvider.complete(prompt);

    return {
      text: response.text,
      metadata: {
        model: options?.model,
        tokensUsed: response.tokens
      }
    };
  }

  getProviderName(): string {
    return 'MyCustomProvider';
  }

  async isAvailable(): Promise<boolean> {
    // Check if your service is available
    return true;
  }
}

// Use it
const llmService = new MyCustomLLMService();
const foundHints = await getRelevantHints('my query', { llmService });
```

## Advanced Options

### Custom Glob Patterns

```typescript
import { getRelevantHints } from './hint-db/getRelevantHints.js';
import { join } from 'path';
import { PROJECT_ROOT_DIR } from '../dirs.js';

const foundHints = await getRelevantHints('React patterns', {
  patterns: [
    join(PROJECT_ROOT_DIR, 'src/hints/**/*.md'),
    join(PROJECT_ROOT_DIR, 'docs/guides/**/*.md')
  ],
  maxHints: 10
});
```

### Fine-tuning LLM Parameters

```typescript
const foundHints = await getRelevantHints('Database setup', {
  model: 'llama3',           // Override model
  temperature: 0.2,          // Lower = more deterministic
  maxHints: 3,               // Limit number of results
});
```

## API Reference

### `getRelevantHints(inputText, options?)`

Finds the most relevant hint files based on input text.

**Parameters:**
- `inputText` (string): The query or description of what you're looking for
- `options` (GetRelevantHintsOptions): Optional configuration

**Returns:** `Promise<FoundHints>`

### `FoundHints` Methods

- `getHintNames()`: Get array of hint names
- `getCount()`: Get number of hints found
- `hasHints()`: Check if any hints were found
- `getHintContent(hintName)`: Get full content of a specific hint
- `getAllHintContents()`: Get all hint contents as objects
- `getConcatenatedContent(separator?)`: Get all hints as one string
- `forEach(callback)`: Iterate over hints
- `map(callback)`: Transform hints

### `LLMService` Interface

All LLM services must implement:
- `generate(prompt, options?)`: Generate text from a prompt
- `getProviderName()`: Get the name of the provider
- `isAvailable()`: Check if the service is available

## Migration Guide

### Switching from Ollama to Claude Agent SDK

1. Install the Anthropic SDK:
   ```bash
   pnpm add @anthropic-ai/sdk
   ```

2. Complete the implementation in `claude-agent-service.ts` (see inline comments)

3. Update your code:
   ```typescript
   // Before
   const foundHints = await getRelevantHints('query');

   // After
   import { ClaudeAgentLLMService } from './hint-db/llm-services/index.js';
   const llmService = new ClaudeAgentLLMService();
   const foundHints = await getRelevantHints('query', { llmService });
   ```

4. Set environment variable:
   ```bash
   export ANTHROPIC_API_KEY=your-api-key
   ```
