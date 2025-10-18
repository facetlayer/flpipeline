---
description: Guidelines for writing CLAUDE.md project documentation
---

# Guidelines for Writing CLAUDE.md

The CLAUDE.md file is a project-level documentation file that helps AI assistants and developers understand the project structure and key development workflows.

## Required Sections

A well-structured CLAUDE.md should include these sections:

### 1. Project Title

Start with a clear title that identifies the project.

Example:
```markdown
# MCP Eval Platform
```

### 2. Overview

A brief description of what the project does and its purpose.

Example:
```markdown
## Overview

This project is a desktop app for doing testing and validating Model Context Protocol servers.
The product helps developers ensure their MCP integrations work correctly, optimize performance, and identify context flooding issues.
```

### 3. Project Directory Layout

Document the important directories in the project. For each major directory, include:
- The directory path
- A brief description of what it contains
- Important subdirectories and what they contain

Example structure:
```markdown
## Project Directory Layout

### ./docs

Project documentation.

Includes:
- Guides on development on various areas
- Product design guides on how the product works
- Tech outlines detailing how features are implemented

### ./web

Frontend web files using Next.js.

Subdirectories:
 `./web/src/api/*` - Implements the client for using the API
 `./web/src/ui/*` - React components for view and styling
 `./web/src/components/*` - Shared components for various screens

### ./api

Backend API

Subdirectories:
 `./api/src/_framework` - Implements the web framework
 `./api/src/_main` - Implements entry points and singleton objects
```

### 4. Useful Tools

List the most important command-line tools used during development. For each tool, show:
- The command to run
- A brief comment explaining what it does

Example:
```markdown
# Useful Tools

Various tools that are especially useful during development.

```
    # Create a token for a local CLI session:
    ./bin/setup-test-credentials --user-id TestUser --session

    # Call an endpoint on the API server with authentication
    ./tools/request-tool /health

    # Regenerate the Typescript types that are based on the server API schemas:
    ./bin/generate-api-clients

    # Delete the local SQlite databases in case of a non-migratable schema change:
    ./tools/reset-test-database.ts
```
```

### 5. Development Process (Optional)

If there are important development workflows or processes, document them here.

Example:
```markdown
## Development Process

### Local Services

For running processes locally, use the Candle MCP tool.

Candle has tools which can:
- Launch or restart services
- Read service logs

Port numbers are dynamically assigned. To find the latest port numbers, read `web/.env` or `api/.env`
```

## Writing Guidelines

### Directory Layout Section

- Focus on the **most important** directories that developers need to know about
- For each directory, explain its **purpose** and **contents**
- Include subdirectories when they represent distinct functional areas
- Use bullet points or inline code for subdirectory listings

### Useful Tools Section

- List tools that are **frequently used** during development
- Show the **actual command** to run each tool
- Add a **comment** above each command explaining what it does
- Include tools for:
  - Running/testing the application
  - Database management
  - Code generation
  - Building/deployment
  - Development utilities

### Keep It Concise

- The CLAUDE.md file should be a quick reference
- Avoid extensive details that belong in separate documentation
- Link to other docs when appropriate (e.g., "See docs/Dev-Local-Request-Tool.md for more details")

## When to Update CLAUDE.md

Update the CLAUDE.md file when:
- Adding new major directories to the project
- Adding new development tools that are frequently used
- Changing the project structure significantly
- Adding important development workflows
