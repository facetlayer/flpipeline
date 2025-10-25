---
description: List all available hint files in the project
---

# List Hints

Run the flpipeline CLI to list all available hint files:

```bash
flpipeline list-all-hints
```

To see detailed descriptions and relevance criteria, use the verbose flag:

```bash
flpipeline list-all-hints --verbose
```

This command will show all hint files that are available in:
- Default hint patterns from flpipeline
- Project-specific hint patterns configured in your .flpipeline.json

Present the output to the user in a clear, organized format.
