# flpipeline Plugin Directory

This directory contains everything needed to use flpipeline as a Claude Code plugin.

## Contents

- **PLUGIN.md** - Complete plugin setup and usage guide
- **TESTING_PLUGIN.md** - Instructions for testing the plugin locally
- **local-marketplace/** - Local marketplace for development/testing

## Quick Start

1. **Install the plugin locally:**
   ```bash
   claude
   /plugin marketplace add /Users/andy.fischer/flpipeline/plugin/local-marketplace
   /plugin install flpipeline@flpipeline-local
   ```

2. **Use the slash commands:**
   - `/list-hints` - List all available hint files
   - `/search-hints` - Search for relevant hints
   - `/show-hints` - Display hint contents
   - `/index-docs` - Index documentation
   - `/search-docs` - Search documentation

## Documentation

- [PLUGIN.md](./PLUGIN.md) - Full plugin documentation
- [TESTING_PLUGIN.md](./TESTING_PLUGIN.md) - Testing and development guide

## Marketplace Structure

The `local-marketplace/` directory contains a marketplace configuration that points back to the flpipeline repository root:

```json
{
  "plugins": [
    {
      "name": "flpipeline",
      "source": "../../"
    }
  ]
}
```

This allows you to test the plugin locally before distributing it via a public marketplace.

## Distribution

To distribute this plugin to your team or the public:

1. Create a public Git repository for your marketplace
2. Copy the marketplace structure (or reference this repo)
3. Update documentation with the public marketplace URL
4. Users can then install via: `/plugin marketplace add your-org/your-marketplace`

## Support

See the main project README and documentation for more information.
