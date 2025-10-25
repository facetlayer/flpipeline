
# flpipeline

Task-based orchestrator for Claude Code with hint management and documentation search

## Features

- **Hint Management**: LLM-powered semantic search for code hints and best practices
- **Documentation RAG**: Vector-based search through project documentation
- **Task Orchestration**: Automated workflow management for development tasks
- **Claude Code Plugin**: Native integration with Claude Code via slash commands

## Current State

⚠️ **Warning**: Currently this project is highly experimental and not ready for wide usage.

## Quick Start

### As a CLI Tool

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the project:
   ```bash
   pnpm build
   ```

3. Create configuration (`.flpipeline.json`):
   ```json
   {
     "llmProvider": {
       "type": "ollama",
       "model": "llama3.2:3b"
     },
     "hintPatterns": ["hints/**/*.md"]
   }
   ```

4. Use the CLI:
   ```bash
   flpipeline list-all-hints
   flpipeline search-hints "testing best practices"
   flpipeline show-hints "node js type stripping"
   ```

### As a Claude Code Plugin

See [plugin/PLUGIN.md](./plugin/PLUGIN.md) for detailed plugin installation and usage instructions.

Quick install:
```bash
claude
/plugin marketplace add /path/to/flpipeline/plugin/local-marketplace
/plugin install flpipeline@flpipeline-local
```

Then use slash commands in Claude Code:
- `/list-hints` - List all available hint files
- `/search-hints` - Search for relevant hints
- `/show-hints` - Display hint contents
- `/search-docs` - Search project documentation
- `/index-docs` - Index documentation for search

## Available Commands

- `list-all-hints` - List all available hint files
- `search-hints <query>` - Search for relevant hints using LLM
- `show-hints <query>` - Display full content of matching hints
- `index-docs` - Index project documentation
- `search-docs <query>` - Search indexed documentation

## Configuration

Create `.flpipeline.json` in your project root:

```json
{
  "llmProvider": {
    "type": "ollama",
    "model": "llama3.2:3b",
    "baseUrl": "http://localhost:11434"
  },
  "hintPatterns": [
    "hints/**/*.md",
    ".claude/hints/**/*.md"
  ],
  "docsPath": "./docs"
}
```

## Documentation

- [Plugin Setup Guide](./plugin/PLUGIN.md) - How to use as a Claude Code plugin
- [Plugin Testing Guide](./plugin/TESTING_PLUGIN.md) - Local testing instructions
- [Configuration Guide](./.flpipeline.json.example) - Example configuration file

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Type check
pnpm typecheck

# Build
pnpm build
```
