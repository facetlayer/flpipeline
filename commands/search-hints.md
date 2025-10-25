---
description: Search for relevant hint files using LLM-powered semantic search
---

# Search Hints

Search for relevant hint files based on a query using LLM-powered semantic search.

Ask the user for:
1. What they're looking for (the search query)
2. Optionally, how many results they want (default: 5)

Then run the flpipeline CLI:

```bash
flpipeline search-hints "<query>" --limit <number>
```

Example:
```bash
flpipeline search-hints "testing best practices" --limit 3
```

This uses an LLM (configured in .flpipeline.json) to semantically match the query against available hint files. The results show the most relevant hint files based on their descriptions and content.

Present the results to the user and offer to show the full content using the show-hints command.
