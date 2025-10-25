---
description: Search project documentation using RAG (Retrieval Augmented Generation)
---

# Search Documentation

Search through indexed project documentation using vector similarity search.

**Prerequisites**: Documentation must be indexed first using `flpipeline index-docs`

Ask the user for:
1. What they want to search for (the search query)
2. Optionally, the maximum number of results (default: 5)
3. Optionally, the similarity threshold (default: 0.6, range: 0.0-1.0)

Then run the flpipeline CLI:

```bash
flpipeline search-docs "<query>" --limit <number> --similarity <threshold>
```

Example:
```bash
flpipeline search-docs "authentication flow" --limit 3 --similarity 0.7
```

This command:
- Uses vector embeddings to find semantically similar documentation
- Returns the most relevant documentation chunks
- Shows similarity scores for each result

Present the search results to the user with clear context about what documentation was found and how relevant it is.
