---
description: Guidelines for writing hint files for the hint system
relevant_for: Creating new hint files, adding documentation to the hint system, writing best practices guides
---

# Writing Hint Files

Hint files are markdown documents that contain best practices, instructions, and guidance that can be discovered by the LLM-powered hint search system.

Each one should be a focused tip that helps provide advice on a specific topic.

When we start a coding agent, we'll automatically find a list of hints that are related to the original prompt,
and we'll include the hint contents in the prompt. This automatically informs the prompt with more details
about the project's best practices, and lessons learned from the past.

## File Location

Hint files are usually stored with the project at:
```
src/hints/
```

## File Format

Hint files are markdown documents with YAML frontmatter metadata at the top.

### Basic Structure

```markdown
---
description: Brief one-line description of what this hint covers
relevant_for: Optional criteria for when this hint should be used
---

# Hint Title

[Content goes here...]
```

## Frontmatter Fields

### Required Fields

#### description

**Type:** String (required)
**Purpose:** A concise one-line summary of what the hint covers

**Guidelines:**
- Keep it brief (ideally under 80 characters)
- Start with "How to..." or a descriptive phrase
- Focus on what the hint helps with, not implementation details
- This field is shown to the LLM during hint selection

**Examples:**
```yaml
description: How to set up a new Next.js web project
description: How to make SQL queries when using the facetlayer/sqlite-wrapper library
description: Guidelines for writing CLAUDE.md project documentation
```

### Optional Fields

#### relevant_for

**Type:** String (optional)
**Purpose:** Comma-separated list of scenarios when this hint should be used

**Guidelines:**
- Provide specific use cases or trigger phrases
- Include variations and synonyms
- Help the LLM understand exactly when to recommend this hint
- Think about what users might search for

**Examples:**
```yaml
relevant_for: Setting up a new Next.js project from scratch, initializing a Next.js application, creating a new Next.js project
```

```yaml
relevant_for: Writing documentation for AI assistants, creating CLAUDE.md files, documenting project structure
```

**When to use:**
- When the hint is specific to particular scenarios
- When the description alone might not capture all use cases
- When you want to include alternative phrasings or synonyms

## File Naming Conventions

Use kebab-case with semantic prefixes:

### Common Prefixes

| Prefix | Purpose | Example |
|--------|---------|---------|
| `new-project-setup-*` | Project initialization guides | `new-project-setup-nextjs.md` |
| `library-usage-*` | Third-party library documentation | `library-usage-sqlite-wrapper.md` |
| `application-architecture-*` | Architectural patterns | `application-architecture-local-state-directories.md` |
| `writing-*` | Documentation and writing guides | `writing-claude-md.md` |
| `managing-*` | Management and workflow guides | `managing-claude-skills.md` |

### Naming Guidelines

- Use descriptive, specific names
- Include the technology or tool name when relevant
- Keep names concise but clear
- Avoid generic names like "setup.md" or "guide.md"

**Good names:**
- `new-project-setup-typescript.md`
- `library-usage-streams.md`
- `react-js-best-practices.md`

**Poor names:**
- `setup.md` (too generic)
- `how-to-use-react-and-write-good-code.md` (too long)
- `tipsAndTricks.md` (not descriptive)

## Content Guidelines

### Structure Your Content

Organize your hint with clear sections:

1. **Introduction** - Brief overview of what this hint covers
2. **Main Content** - Instructions, examples, best practices
3. **Examples** - Code samples or practical demonstrations
4. **Additional Notes** - Edge cases, warnings, or related information

### Include Code Examples

When relevant, include code examples with proper syntax highlighting:

````markdown
```typescript
const example = 'Use syntax highlighting';
```

```bash
$ command --with-flags
```
````

### Be Specific and Actionable

- Provide concrete instructions, not vague advice
- Include actual commands, file paths, and configuration values

**Good:**
```markdown
Run the following command:
    $ npx create-next-app@latest web --typescript --eslint
```

**Poor:**
```markdown
Use the create-next-app tool to set up your project with the appropriate flags.
```

## Content Style

### Write for AI Assistants

Remember that hints are primarily consumed by AI assistants (like Claude) to help users:

- Be explicit and detailed rather than conversational
- Include context that might be obvious to humans but helpful for LLMs
- Avoid ambiguous pronouns ("it", "this", "that")
- State prerequisites and assumptions clearly

### Be Concise but Complete

- Don't include unnecessary background or history
- Focus on practical, actionable information
- Include enough context to understand why something matters
- Link to external docs for deep dives

## Example Hint File

Here's a complete example demonstrating best practices:

```markdown
---
description: How to set up environment variables in Node.js projects
relevant_for: Setting up .env files, configuring environment variables, managing secrets in Node.js
---

# Environment Variables in Node.js

This guide covers how to properly set up and use environment variables in Node.js projects.

## Installation

Install the dotenv package:

    $ npm install dotenv

## Creating .env File

Create a `.env` file in your project root:

```
API_KEY=your-api-key-here
DATABASE_URL=postgresql://localhost:5432/mydb
PORT=3000
```

## Loading Environment Variables

Add this at the top of your entry file (before other imports):

```typescript
import 'dotenv/config';
```

Or use the require syntax:

```javascript
require('dotenv').config();
```

## Accessing Variables

Access environment variables via `process.env`:

```typescript
const apiKey = process.env.API_KEY;
const port = process.env.PORT || 3000;
```

## Security Best Practices

- Never commit `.env` files to version control
- Add `.env` to your `.gitignore` file
- Create `.env.example` with placeholder values for documentation
- Use different `.env` files for different environments

## When to Create a Hint

Create a hint file when you have:

- **Repeated patterns** - Instructions you find yourself giving multiple times
- **Best practices** - Standards that should be followed consistently
- **Library documentation** - Quick reference for frequently-used libraries
- **Setup procedures** - Standard initialization workflows
- **Architecture patterns** - Design patterns specific to your projects
- **Common gotchas** - Solutions to frequent problems

## Summary

Good hint files are:
- **Discoverable** - Clear frontmatter that helps the LLM find them
- **Actionable** - Specific instructions users can follow immediately
- **Complete** - All necessary information in one place
- **Well-formatted** - Clean markdown with proper structure
- **Maintained** - Kept up-to-date with current best practices
