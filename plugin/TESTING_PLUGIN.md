# Testing the flpipeline Plugin Locally

This guide walks you through testing the flpipeline plugin in a local development environment.

## Prerequisites

1. **Build the flpipeline CLI**:
   ```bash
   cd /Users/andy.fischer/flpipeline
   pnpm install
   pnpm build
   ```

2. **Link the CLI globally** (optional, for easier testing):
   ```bash
   npm link
   # or
   pnpm link --global
   ```

3. **Verify CLI is working**:
   ```bash
   flpipeline --help
   ```

## Testing the Plugin

### Step 1: Add the Test Marketplace

Start Claude Code from a test project directory (not the flpipeline directory itself):

```bash
cd /path/to/your/test/project
claude
```

In Claude Code, add the local marketplace:

```
/plugin marketplace add /Users/andy.fischer/flpipeline/plugin/local-marketplace
```

### Step 2: Install the Plugin

```
/plugin install flpipeline@flpipeline-local
```

Select "Install now" when prompted, then restart Claude Code.

### Step 3: Verify Installation

After restarting Claude Code:

1. Check the plugin is installed:
   ```
   /plugin
   ```
   Look for "flpipeline" in the installed plugins list.

2. Check the commands are available:
   ```
   /help
   ```
   You should see:
   - `/list-hints`
   - `/search-hints`
   - `/show-hints`
   - `/index-docs`
   - `/search-docs`

### Step 4: Test the Commands

#### Test List Hints

```
/list-hints
```

Claude should run `flpipeline list-all-hints` and show the results.

#### Test Search Hints

```
/search-hints
```

Claude will ask for a search query. Try: "testing best practices"

#### Test Show Hints

```
/show-hints
```

Claude will ask for a search query. Try: "node js type stripping"

## Setting Up a Test Project

To fully test the plugin, create a test project with hints:

```bash
# Create test project
mkdir ~/test-flpipeline
cd ~/test-flpipeline

# Create configuration
cat > .flpipeline.json << 'EOF'
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
EOF

# Create sample hints
mkdir -p hints

cat > hints/testing.md << 'EOF'
---
description: Best practices for writing tests
relevant_for: testing, unit tests, integration tests
---

# Testing Best Practices

1. Write descriptive test names
2. Test one thing at a time
3. Use arrange-act-assert pattern
4. Mock external dependencies
EOF

cat > hints/typescript.md << 'EOF'
---
description: TypeScript tips and tricks
relevant_for: typescript, type safety, generics
---

# TypeScript Tips

1. Use strict mode
2. Leverage type inference
3. Prefer interfaces over types for objects
4. Use union types effectively
EOF
```

Now start Claude Code and test the plugin commands in this project.

## Troubleshooting

### Commands not working

1. **Verify flpipeline CLI is in PATH**:
   ```bash
   which flpipeline
   flpipeline --help
   ```

2. **Check plugin is installed**:
   ```
   /plugin
   ```

3. **Verify marketplace path is correct**:
   ```
   /plugin marketplace list
   ```

### LLM service errors

1. **For Ollama**: Make sure Ollama is running:
   ```bash
   ollama serve
   ```

2. **Test Ollama directly**:
   ```bash
   ollama list
   ollama run llama3.2:3b "Hello"
   ```

3. **Check configuration** in `.flpipeline.json`:
   - Verify `type` is "ollama"
   - Verify `model` matches an installed model
   - Verify `baseUrl` is correct (default: http://localhost:11434)

### Making Changes and Retesting

After making changes to the plugin:

1. Uninstall the current version:
   ```
   /plugin uninstall flpipeline@flpipeline-local
   ```

2. Rebuild if you changed CLI code:
   ```bash
   cd /Users/andy.fischer/flpipeline
   pnpm build
   ```

3. Reinstall the plugin:
   ```
   /plugin install flpipeline@flpipeline-local
   ```

4. Restart Claude Code

## Next Steps

Once testing is complete and the plugin works correctly:

1. Create a public Git repository for the marketplace
2. Push the marketplace configuration
3. Update documentation with the public marketplace URL
4. Share with your team or the community

## Example Test Session

Here's a complete test session:

```
# Start Claude Code
cd ~/test-flpipeline
claude

# Add marketplace
/plugin marketplace add /Users/andy.fischer/flpipeline/plugin/local-marketplace

# Install plugin
/plugin install flpipeline@flpipeline-local
[Restart Claude Code]

# Test commands
/help
# Should see all flpipeline commands

/list-hints
# Should list hints from hints/ directory

/search-hints
# Enter query: "testing"
# Should find the testing.md hint

/show-hints
# Enter query: "typescript"
# Should display the full content of typescript.md
```

Success! The plugin is now working correctly.
