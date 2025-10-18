---
description: How to create, modify, and manage Claude Code skills
---

# Managing Claude Code Skills

## What are Claude Skills?

Claude skills are custom instructions that can be invoked to provide specialized guidance and context for specific tasks or domains.

## Skill File Location

All skill files are stored in:
```
~/home/dot/claude-skills/
```

## Skill Directory Structure

Each skill is stored in its own directory with two files:

```
skill-name/
├── skill.json          # Metadata and configuration
└── skill.md           # The actual skill prompt/instructions
```

### skill.json Format

The `skill.json` file contains metadata:

```json
{
  "name": "skill-name",
  "description": "Brief description of what the skill does",
  "version": "1.0.0"
}
```

### skill.md Format

The `skill.md` file contains the actual instructions, guidelines, or documentation that will be loaded when the skill is invoked. This can include:

- Best practices
- Code examples
- API documentation
- Workflow guidelines
- Architecture patterns
- Library usage instructions

## Modifying Existing Skills

Skills can be modified at any time by editing the files in `~/home/dot/claude-skills/`.

To modify a skill:
1. Read the existing skill file(s)
2. Edit the `skill.md` content to update instructions
3. Update the `skill.json` if metadata needs to change (description, version, etc.)

## Creating New Skills

To create a new skill:
1. Create a new directory under `~/home/dot/claude-skills/`
2. Add a `skill.json` file with the required metadata
3. Add a `skill.md` file with the skill content

Example:
```bash
mkdir ~/home/dot/claude-skills/my-new-skill
```

Then create the two required files with appropriate content.

## Skill Naming Conventions

- Use kebab-case for skill directory names (e.g., `react-js-best-practices`)
- Keep names descriptive but concise
- Common prefixes:
  - `new-project-setup-*` for project initialization guides
  - `library-usage-*` for third-party library documentation
  - `application-architecture-*` for architectural patterns

## When to Create Skills

Consider creating a skill when you have:
- Repeated best practices or guidelines used across multiple projects
- Library or framework documentation that's frequently referenced
- Project setup workflows that should be standardized
- Architecture patterns that should be consistently applied
- Code style guidelines specific to your workflow

## User Requests

If the user asks to modify, update, or create a skill:
1. Read the existing skill files if modifying
2. Make the requested changes
3. Use the Edit or Write tools to update the files
4. Confirm the changes with the user
