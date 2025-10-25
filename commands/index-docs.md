---
description: Index documentation files for RAG-powered search
---

# Index Documentation

Index documentation files to enable semantic search using vector embeddings. This creates a searchable database of documentation that can be queried with natural language.

Ask the user for:
1. Optionally, the path to the documentation directory (if not specified, uses project configuration)

Then run the flpipeline CLI:

```bash
flpipeline index-docs
```

Or with a specific path:

```bash
flpipeline index-docs --path /path/to/docs
```

This command:
- Scans the documentation directory for markdown and text files
- Generates vector embeddings for each documentation chunk
- Stores the embeddings in a local SQLite database
- Prepares the documentation for fast semantic search

The indexed documentation can then be searched using the `search-docs` command.

Inform the user when indexing is complete and suggest they can now use `search-docs` to find relevant documentation.
