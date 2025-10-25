# flpipeline Claude Code Plugin

This plugin extends Claude Code with task orchestration, hint management, and documentation search capabilities.

## Features

The flpipeline plugin provides the following slash commands in Claude Code:

### Hint Management

- `/list-hints` - List all available hint files in the project
- `/search-hints` - Search for relevant hint files using LLM-powered semantic search
- `/show-hints` - Display full content of hint files matching a search query

### Documentation Search (RAG)

- `/index-docs` - Index documentation files for RAG-powered search
- `/search-docs` - Search project documentation using vector similarity

## Installation

### Prerequisites

1. Install the flpipeline CLI tool:
   ```bash
   npm install -g @facetlayer/flpipeline
   ```
   Or if developing locally, build the project:
   ```bash
   pnpm install
   pnpm build
   ```

2. Create a configuration file `.flpipeline.json` in your project root:
   ```json
   {
     "llmProvider": {
       "type": "ollama",
       "model": "llama3.2:3b",
       "baseUrl": "http://localhost:11434"
     },
     "hintPatterns": [
       "hints/**/*.md"
     ]
   }
   ```

### Install the Plugin

#### Option 1: Via Local Marketplace (for development/testing)

1. Add the marketplace:
   ```bash
   claude
   /plugin marketplace add /path/to/flpipeline/plugin/local-marketplace
   ```

2. Install the plugin:
   ```bash
   /plugin install flpipeline@flpipeline-local
   ```

#### Option 2: Via Git Repository Marketplace (for distribution)

If the marketplace is hosted in a Git repository:

```bash
claude
/plugin marketplace add your-org/flpipeline-marketplace
/plugin install flpipeline@your-org
```

## Usage

Once installed, you can use the slash commands in any Claude Code session:

### List All Hints

```
/list-hints
```

Claude will run `flpipeline list-all-hints` and show you all available hint files.

### Search for Hints

```
/search-hints
```

Claude will ask what you're looking for, then run `flpipeline search-hints` to find relevant hints using LLM-powered semantic search.

### Show Hint Contents

```
/show-hints
```

Claude will ask for your search query and then display the full content of matching hint files.

### Index Documentation

```
/index-docs
```

Claude will index your project documentation for semantic search.

### Search Documentation

```
/search-docs
```

Claude will search through indexed documentation using vector similarity to find relevant content.

## Configuration

### LLM Provider Configuration

The plugin uses the LLM configuration from `.flpipeline.json`. Supported providers:

#### Ollama (Local)

```json
{
  "llmProvider": {
    "type": "ollama",
    "model": "llama3.2:3b",
    "baseUrl": "http://localhost:11434"
  }
}
```

#### Claude Agent (Anthropic)

```json
{
  "llmProvider": {
    "type": "claude",
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

Note: Claude Agent provider requires API keys to be configured in `.api-keys.json`

### Hint Patterns

Configure where to look for hint files in `.flpipeline.json`:

```json
{
  "hintPatterns": [
    "hints/**/*.md",
    "docs/hints/**/*.md",
    ".claude/hints/**/*.md"
  ]
}
```

### Hint File Format

Hint files should be markdown files with frontmatter:

```markdown
---
description: Brief description of what this hint covers
relevant_for: Keywords or phrases that make this hint relevant
---

# Hint Title

Your hint content here...
```

## Development

### Project Structure

```
flpipeline/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
├── commands/                 # Claude Code slash commands
│   ├── list-hints.md
│   ├── search-hints.md
│   ├── show-hints.md
│   ├── index-docs.md
│   └── search-docs.md
├── src/                      # CLI implementation
│   ├── commands/            # Command implementations
│   ├── hint-db/             # Hint database and search
│   ├── project-rag/         # Documentation RAG system
│   └── main-cli.ts          # CLI entry point
└── package.json
```

### Testing Changes

1. Make changes to the plugin files
2. Uninstall the current version:
   ```bash
   /plugin uninstall flpipeline@flpipeline-local
   ```
3. Reinstall to test:
   ```bash
   /plugin install flpipeline@flpipeline-local
   ```

### Building the CLI

```bash
pnpm install
pnpm build
```

The built CLI will be in `dist/main-cli.js`.

## Troubleshooting

### Plugin commands not showing up

1. Verify the plugin is installed: `/plugin` → "Manage Plugins"
2. Check that `/help` shows the new commands
3. Restart Claude Code if needed

### CLI commands failing

1. Verify flpipeline CLI is in your PATH:
   ```bash
   which flpipeline
   ```
2. Test the CLI directly:
   ```bash
   flpipeline list-all-hints
   ```
3. Check your `.flpipeline.json` configuration

### LLM service not available

1. For Ollama: Ensure Ollama is running (`ollama serve`)
2. For Claude Agent: Check API keys in `.api-keys.json`
3. Verify the model name matches an available model

## License

See the main project license.

## Support

For issues and feature requests, please use the project's issue tracker.
