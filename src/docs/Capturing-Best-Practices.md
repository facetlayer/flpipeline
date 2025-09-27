# Capturing Best Practices

## Overview

Best practices documents capture reusable patterns and approaches that teams can apply across projects. They should be practical, actionable, and focused on specific technical problems.

## File Naming Strategy

- Use descriptive, hyphenated names: `Local-State-Directories.md`
- Start with the main concept, add specifics: `Error-Handling-Async-Operations.md`
- Place in `/docs/bestpractices/` for project-specific patterns
- Use title case for readability

## Expected Content Sections

### ## Overview
Brief explanation of the pattern and why it matters. 1-2 paragraphs maximum.

### ## When To Use This Pattern
Clear criteria for when this approach applies. Include specific scenarios or problems it solves.

### ## Details
The core implementation or approach. Include:
- Step-by-step process
- Key principles
- Important considerations

### ## Examples
Concrete code samples and usage scenarios. Show both the pattern and how to apply it in different contexts.

## Writing Guidelines

- Focus on one specific pattern per document
- Include working code examples
- Write for developers who need to implement the pattern
- Avoid project-specific terminology when the pattern is generally applicable

## Review Criteria

Good best practice docs answer:
- What problem does this solve?
- When should I use this?
- How do I implement it?
- What are the trade-offs?

## Capturing Existing Code

In many cases you'll be tasked with capturing and describing a best practice that is found
in an existing codebase.

When doing this, make sure:
 - Capture the essence of the specific topic.
 - Make the document abstract enough that it can apply to any project.
 - Make the content focused on only one topic at a time.
 - Ignore / remove extraneous details from the source code that aren't relevant to the concept.

