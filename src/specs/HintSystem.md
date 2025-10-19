# Hint System Specification

## Overview

The Hint System is a LLM-powered knowledge retrieval system that helps users find relevant guidance and best practices from a curated collection of hint files. Users provide a natural language query, and the system uses an LLM to intelligently select the most relevant hints based on their descriptions and relevance criteria.

## Architecture

### Core Components

The hint system consists of four main components:

1. **Hint Files** (`src/hints/**/*.md`) - Markdown files containing guidance, best practices, and instructions
2. **Listing System** (`getListing.ts`) - Discovers and catalogs available hint files with their metadata
3. **Relevance Matcher** (`getRelevantHints.ts`) - Uses an LLM to find the most relevant hints for a query
4. **LLM Service Layer** (`llm-service.ts` and `llm-services/**`) - Pluggable architecture for different LLM providers

### Component Diagram

```
User Query
    ↓
search-hints CLI Command (src/commands/searchHints.ts)
    ↓
getRelevantHints() (src/hint-db/getRelevantHints.ts)
    ↓
    ├──→ getListing() - Read all hint files and extract metadata
    ↓
    └──→ LLM Service - Analyze query and select relevant hints
         (Ollama, Claude, or custom provider)
    ↓
FoundHints - Return matched hints with their content
```

## Hint Files

### File Structure

Hint files are Markdown documents stored in `src/hints/` with frontmatter metadata.

**Location:** `src/hints/**/*.md`

**Format:**
```markdown
---
description: Brief one-line description of what this hint covers
relevant_for: Optional comma-separated criteria for when this hint applies
---

# Hint Content

[Detailed instructions, code examples, best practices, etc.]
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `description` | Yes | One-line summary of the hint's purpose |
| `relevant_for` | No | Specific scenarios when this hint should be used |

### Example Hint File

**File:** `src/hints/new-project-setup-nextjs.md`

```markdown
---
description: How to set up a new Next.js web project
relevant_for: Setting up a new Next.js project from scratch, initializing a Next.js application, creating a new Next.js project
---

## How to Set up a Next.js Web Project

- Use the latest version of Next.js
- Enable TypeScript and ESLint
- Enable Tailwind CSS
...
```

### Naming Conventions

Hint files follow kebab-case naming with semantic prefixes:

- `new-project-setup-*` - Project initialization guides
- `library-usage-*` - Third-party library documentation
- `application-architecture-*` - Architectural patterns
- `writing-*` - Documentation and writing guidelines
- `managing-*` - Management and workflow guides

**Examples:**
- `new-project-setup-nextjs.md`
- `library-usage-sqlite-wrapper.md`
- `application-architecture-local-state-directories.md`
- `writing-claude-md.md`

## getListing() - Hint Discovery

**File:** `src/hint-db/getListing.ts`

### Purpose

Discovers all hint files matching glob patterns and extracts their metadata (name, description, relevant_for).

### Function Signature

```typescript
async function getListing(options?: GetListingOptions): Promise<HintInfo[]>

interface GetListingOptions {
  patterns?: string[];  // Defaults to ['src/hints/**/*.md']
}

interface HintInfo {
  name: string;          // Filename without .md extension
  description: string;   // From frontmatter
  relevant_for?: string; // Optional criteria from frontmatter
}
```

### Algorithm

1. Accept glob patterns (defaults to `src/hints/**/*.md`)
2. Use `glob` package to find all matching markdown files
3. For each file:
   - Read file content
   - Parse frontmatter using `gray-matter`
   - Extract filename (without .md) as `name`
   - Extract `description` and optional `relevant_for` from frontmatter
4. Sort results alphabetically by name
5. Return array of `HintInfo` objects

### Example Usage

```typescript
import { getListing } from './hint-db/getListing.js';

// Get all hints from default location
const hints = await getListing();

// Get hints from custom patterns
const customHints = await getListing({
  patterns: [
    'src/hints/**/*.md',
    'docs/guides/**/*.md'
  ]
});
```

## getRelevantHints() - LLM-Powered Matching

**File:** `src/hint-db/getRelevantHints.ts`

### Purpose

Uses an LLM to analyze a user's query and intelligently select the most relevant hints from the available catalog.

### Function Signature

```typescript
async function getRelevantHints(
  inputText: string,
  options?: GetRelevantHintsOptions
): Promise<FoundHints>

interface GetRelevantHintsOptions extends GetListingOptions {
  llmService?: LLMService;  // Defaults to OllamaLLMService
  model?: string;           // Override default model
  temperature?: number;     // Defaults to 0.3
  maxHints?: number;        // Defaults to 5
}
```

### Algorithm

1. **Get Hint Catalog**
   - Call `getListing()` to fetch all available hints with metadata
   - If no hints found, return empty `FoundHints`

2. **Format Hints for LLM**
   - Create numbered list of hints with descriptions
   - Include `relevant_for` criteria when available
   - Example format:
     ```
     1. new-project-setup-nextjs - How to set up a new Next.js web project
        Relevant for: Setting up a new Next.js project from scratch, initializing a Next.js application
     2. library-usage-sqlite-wrapper - How to make SQL queries when using the facetlayer/sqlite-wrapper library
     ```

3. **Construct LLM Prompt**
   - System instructions explaining the task
   - Full list of formatted hints
   - User's query
   - Request JSON array response with hint names
   - Example prompt structure:
     ```
     You are a helpful assistant that selects the most relevant hint files.

     Available hint files:
     [formatted hint list]

     Your task:
     - Analyze the user's request and return ONLY truly relevant hints
     - Pay attention to "Relevant for" field
     - Return 0-5 hints (fewer is better if others aren't relevant)

     User's request: [user query]

     Respond with ONLY a JSON array of hint names.
     Examples: ["hint-name-1", "hint-name-2"] or []
     ```

4. **Query LLM**
   - Send prompt to configured LLM service
   - Use specified temperature (default: 0.3 for deterministic results)

5. **Parse Response**
   - Extract JSON array from LLM response using regex: `/\[[\s\S]*\]/`
   - Parse JSON to get array of hint names
   - Validate that returned hints exist in the catalog
   - Filter to only valid hints
   - Limit to `maxHints` (default: 5)

6. **Return FoundHints**
   - Create `FoundHints` instance with validated hint names
   - Provides methods to access hint content

### Example Usage

```typescript
import { getRelevantHints } from './hint-db/getRelevantHints.js';

// Basic usage with defaults (Ollama)
const foundHints = await getRelevantHints('How do I set up a Next.js project?');

// With custom options
const foundHints = await getRelevantHints('React patterns', {
  maxHints: 3,
  temperature: 0.2,
  model: 'llama3'
});

// Access results
console.log(`Found ${foundHints.getCount()} hints`);
foundHints.getHintNames().forEach(name => {
  console.log(`- ${name}`);
  const content = foundHints.getHintContent(name);
});
```

## FoundHints Class

**File:** `src/hint-db/getRelevantHints.ts`

### Purpose

Container class for accessing matched hints and their content.

### Constructor

```typescript
new FoundHints(hintNames: string[], hintsDir?: string)
```

- `hintNames` - Array of hint filenames (without .md extension)
- `hintsDir` - Directory containing hint files (defaults to `src/hints`)

### Methods

#### getHintNames(): string[]
Returns array of hint filenames.

```typescript
const names = foundHints.getHintNames();
// ['new-project-setup-nextjs', 'library-usage-streams']
```

#### getCount(): number
Returns number of hints found.

```typescript
const count = foundHints.getCount(); // 2
```

#### hasHints(): boolean
Checks if any hints were found.

```typescript
if (foundHints.hasHints()) {
  console.log('Found hints!');
}
```

#### getHintContent(hintName: string): string
Reads and returns full content of a specific hint file.

```typescript
const content = foundHints.getHintContent('new-project-setup-nextjs');
// Returns full markdown content
```

#### getAllHintContents(): Array<{ name: string; content: string }>
Returns all hint contents as objects.

```typescript
const allContents = foundHints.getAllHintContents();
// [
//   { name: 'hint-1', content: '...' },
//   { name: 'hint-2', content: '...' }
// ]
```

#### getConcatenatedContent(separator?: string): string
Returns all hints as a single concatenated string.

```typescript
const combined = foundHints.getConcatenatedContent();
// Default separator: '\n\n---\n\n'
```

## LLM Service Layer

### Architecture

The hint system uses a plugin architecture that allows swapping between different LLM providers without changing core logic.

### LLMService Interface

**File:** `src/hint-db/llm-service.ts`

```typescript
interface LLMService {
  // Generate text from a prompt
  generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResponse>;

  // Get provider name
  getProviderName(): string;

  // Check if service is available
  isAvailable(): Promise<boolean>;
}

interface LLMGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface LLMResponse {
  text: string;
  metadata?: {
    model?: string;
    tokensUsed?: number;
  };
}
```

### Supported Providers

#### 1. Ollama (Default)

**File:** `src/hint-db/llm-services/ollama-service.ts`

**Configuration:**
```typescript
new OllamaLLMService({
  host: 'http://localhost:11434',  // Defaults to OLLAMA_HOST env var
  defaultModel: 'llama2'            // Default model
})
```

**Features:**
- Uses `ollama` npm package
- Synchronous generation (stream: false)
- Availability check via `.list()` API call
- Returns token usage in metadata

#### 2. Claude (Anthropic API)

**File:** `src/hint-db/llm-services/claude-agent-service.ts`

**Configuration:**
```typescript
new ClaudeLLMService({
  apiKey: process.env.ANTHROPIC_API_KEY,  // Or from .api-keys.json
  defaultModel: 'claude-3-5-haiku-20241022'
})
```

**Features:**
- Uses `@anthropic-ai/sdk`
- Requires API key via config or environment variable
- Returns input/output token counts
- Availability check via minimal API call

### Creating Custom LLM Services

Implement the `LLMService` interface:

```typescript
import { LLMService, LLMResponse, LLMGenerateOptions } from './hint-db/llm-service.js';

class CustomLLMService implements LLMService {
  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResponse> {
    // Your implementation
    return {
      text: 'generated text',
      metadata: { model: options?.model }
    };
  }

  getProviderName(): string {
    return 'CustomProvider';
  }

  async isAvailable(): Promise<boolean> {
    // Check if service is available
    return true;
  }
}
```

## Configuration

### Project Configuration

**File:** `.flpipeline.json`

The hint system reads LLM provider configuration from the project's `.flpipeline.json` file.

#### Ollama Configuration

```json
{
  "llmProvider": {
    "provider": "ollama",
    "host": "http://localhost:11434",
    "model": "qwen2.5:0.5b"
  }
}
```

#### Claude Configuration

```json
{
  "llmProvider": {
    "provider": "claude",
    "model": "claude-3-5-haiku-20241022"
  }
}
```

**Note:** API key should be set via environment variable `ANTHROPIC_API_KEY` or in `.api-keys.json` (not in `.flpipeline.json`).

### Configuration Loading

**Files:**
- `src/config/ProjectConfig.ts` - Type definitions
- `src/config/createLLMServiceFromConfig.ts` - Factory function

```typescript
import { getLocalConfigs } from '../config/getLocalConfigs.js';
import { createLLMServiceFromConfig } from '../config/createLLMServiceFromConfig.js';

// Load project configuration
const config = getLocalConfigs(PROJECT_ROOT_DIR);

// Create LLM service from config
const llmService = createLLMServiceFromConfig(config.llmProvider);
```

**Priority:**
1. CLI argument (`--model`)
2. Project config (`.flpipeline.json`)
3. Service default (e.g., 'llama2' for Ollama)

## CLI Interface

### Command: search-hints

**File:** `src/commands/searchHints.ts`
**CLI Definition:** `src/main-cli.ts:80-117`

#### Syntax

```bash
flpipeline search-hints <query> [options]
```

#### Arguments

- `<query>` (required) - Natural language search query

#### Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--limit` | `-l` | number | 5 | Maximum hints to return |
| `--model` | `-m` | string | (from config) | LLM model to use |
| `--temperature` | `-t` | number | 0.3 | LLM temperature (0.0-1.0) |
| `--show-content` | `-c` | boolean | false | Display full hint content |

#### Examples

```bash
# Basic search (uses configuration from .flpipeline.json)
flpipeline search-hints "How do I set up a Next.js project?"

# Limit results
flpipeline search-hints "React patterns" --limit 3

# Override model from config
flpipeline search-hints "TypeScript setup" --model "llama3"

# Show full content
flpipeline search-hints "Database patterns" --show-content

# Adjust temperature for more creative matching
flpipeline search-hints "Testing strategies" --temperature 0.5
```

#### Output Format

**Without --show-content:**
```
Found 2 relevant hint file(s):

1. new-project-setup-nextjs
2. writing-claude-md

Use --show-content to display the full content of the hints.
```

**With --show-content:**
```
Found 2 relevant hint file(s):

1. new-project-setup-nextjs
2. writing-claude-md

================================================================================

Hint 1: new-project-setup-nextjs

[Full markdown content of the hint]

--------------------------------------------------------------------------------

Hint 2: writing-claude-md

[Full markdown content of the hint]
```

#### Error Handling

The command validates:
- Query is not empty
- LLM service is available (via `isAvailable()`)
- Configuration is valid

Error messages include:
- Service unavailability (with provider name)
- Invalid configuration
- LLM response parsing failures

### Implementation Flow

**File:** `src/commands/searchHints.ts`

1. **Load Configuration**
   - Read project config from `.flpipeline.json`
   - Create LLM service instance from config

2. **Determine Model**
   - Priority: CLI arg > config > service default

3. **Check Service Availability**
   - Call `llmService.isAvailable()`
   - Throw error if unavailable with provider-specific message

4. **Search Hints**
   - Call `getRelevantHints()` with query and options
   - Default glob pattern: `src/hints/**/*.md`

5. **Display Results**
   - Show count and list of hint names
   - Optionally show full content with `--show-content`

## Use Cases

### 1. Finding Project Setup Instructions

**Query:** "How do I set up a new Next.js project?"

**Expected Hints:**
- `new-project-setup-nextjs.md` (matches "relevant_for" field)

### 2. Finding Library Documentation

**Query:** "How do I query a SQLite database?"

**Expected Hints:**
- `library-usage-sqlite-wrapper.md` (matches description and content)

### 3. Finding Best Practices

**Query:** "React component patterns"

**Expected Hints:**
- `react-js-best-practices.md`

### 4. Multiple Relevant Hints

**Query:** "I need to set up a web project"

**Expected Hints:**
- `new-project-setup-web.md`
- `new-project-setup-nextjs.md`
- `new-project-setup-web-static-build.md`

## Design Decisions

### Why LLM-Based Matching?

**Advantages:**
1. **Semantic Understanding** - Understands user intent, not just keywords
2. **Flexible Queries** - Users can ask natural language questions
3. **Context-Aware** - Considers "relevant_for" criteria and descriptions
4. **Better Than Keywords** - Handles synonyms and related concepts

**Example:**
- Query: "Set up a React app with server-side rendering"
- Keyword search might miss: "new-project-setup-nextjs"
- LLM understands: Next.js = React + SSR

### Why Frontmatter Metadata?

**Advantages:**
1. **Self-Documenting** - Each hint describes itself
2. **Easy to Maintain** - No separate index file to update
3. **Standard Format** - Markdown frontmatter is widely supported
4. **Flexible** - Can add new metadata fields without breaking existing code

### Why Plugin Architecture for LLMs?

**Advantages:**
1. **Provider Independence** - Switch between Ollama, Claude, OpenAI, etc.
2. **Easy Testing** - Mock LLM service for unit tests
3. **Future-Proof** - Add new providers without changing core logic
4. **Flexibility** - Users choose their preferred LLM

### Temperature Default (0.3)

**Rationale:**
- Lower temperature (0.3) provides more deterministic results
- Hint selection should be consistent, not creative
- Reduces chance of hallucinated hint names
- Still allows some flexibility in interpretation

## Testing

### Test Files

- `src/hint-db/__tests__/getListing.test.ts` - Tests hint discovery
- `src/hint-db/__tests__/getRelevantHints.test.ts` - Tests LLM matching
- `src/hint-db/__tests__/mock-llm-service.ts` - Mock LLM for testing

### Mock LLM Service

**File:** `src/hint-db/__tests__/mock-llm-service.ts`

Used in tests to avoid real LLM calls:

```typescript
class MockLLMService implements LLMService {
  constructor(private responseHints: string[]) {}

  async generate(): Promise<LLMResponse> {
    return {
      text: JSON.stringify(this.responseHints),
      metadata: { model: 'mock' }
    };
  }

  getProviderName(): string {
    return 'Mock';
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}
```

## Future Enhancements

### Potential Improvements

1. **Hint Categories** - Add category metadata for better organization
2. **Hint Dependencies** - Some hints reference others
3. **Usage Analytics** - Track which hints are most frequently matched
4. **Caching** - Cache hint listings to improve performance
5. **Fuzzy Matching** - Fallback to keyword search if LLM unavailable
6. **Hint Validation** - Check that hints follow formatting standards
7. **Multi-Language Support** - Support hints in multiple languages

## Summary

The Hint System provides intelligent, LLM-powered retrieval of best practices and guidance from a curated collection of markdown files. It uses:

- **Markdown files** with frontmatter metadata for self-documenting hints
- **LLM-based matching** for semantic understanding of queries
- **Plugin architecture** for flexible LLM provider support
- **Simple CLI interface** for easy access
- **Project configuration** for customizable LLM settings

The system balances simplicity with power, making it easy to add new hints while providing sophisticated query understanding through LLMs.
