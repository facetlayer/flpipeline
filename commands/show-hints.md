---
description: Display full content of hint files matching a search query
---

# Show Hints

Display the full content of hint files that match a search query. This is useful when you want to read the actual hints, not just the file names.

Ask the user for:
1. What hints they want to see (search query)
2. Optionally, how many results they want (default: 5)

Then run the flpipeline CLI:

```bash
flpipeline show-hints "<query>" --limit <number>
```

Example:
```bash
flpipeline show-hints "node js type stripping" --limit 2
```

This command:
1. Uses LLM-powered search to find relevant hint files
2. Displays the full content of each matching hint file
3. Shows token usage information

The output will include the complete text of each hint file, making it easy to understand the guidance and apply it to the current task.

Present the hint contents to the user in a clear, readable format.
