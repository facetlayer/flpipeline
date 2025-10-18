---
description: Best practices for writing web functional tests
relevant_for: Writing functional tests, creating browser automation tests, working with Playwright or similar web testing frameworks, debugging or fixing failing tests
---

# Writing Web Functional Tests

This document describes best practices for writing functional tests for web applications.

# Antipatterns

Below are some **antipatterns** (things to NOT do, and what to do instead)

## Antipattern: Skips

Don't add any sections that call `test.skip` for any reason. If the test code has `skip` then the test
is broken.

This includes:

 - Don't add `skip` even if you suspect network/timing issues. Instead add the proper waits.
 - Don't add `skip` if the test data is missing. Instead add code that verifies that the test data is populated.

## Antipattern: Time-based delays

Don't add steps with time-based delays such as `new Promise(resolve => setTimeout(resolve, xxx))`

These delays are either unnecessary or they are the sign of a flaky test.

Instead: Remove the delay or add the proper waits on related API calls or visible elements.
The server is fast so it does not usually have many delays.

## Antipattern: Wait for networkidle

Similarly, waiting for 'networkidle' is usually a waste of time. Don't do it. Instead, look for
specific elements on the page that are expected to appear next.

## Antipattern: Text-Based Selectors

Text-based selectors (e.g., `page.locator('text=Select Integration Type')`) are fragile because:
- They break when text content changes (even minor wording updates)
- They depend on exact text matching
- They don't work well with dynamic content
- They make tests brittle during UI iterations

## Antipattern: Tailwind selectors

Additionally, don't use Tailwind classes (such as `p-1` or `block` or etc) as selectors in tests:

Example: Don't write selectors like `page.locator('a.block.p-1.px-2')`

### Recommended strategy: Semantic CSS classnames ###

Instead of text-based selectors or Tailwind selectors: Use semantic CSS classnames
as selectors.

With a semantic CSS classname, the name of the class is added as one of the CSS classes,
and then this can be used as a stable selector.

Example:

```typescript
<div className="LocalProcessOption px-4 py-2 rounded-lg">Local Process (STDIN)</div>
...
await expect(page.locator('.LocalProcessOption')).toBeVisible();
```

When using these:

- Use **PascalCase** for component-level classes (e.g., `SelectTypeTitle`)
- Be specific and descriptive (e.g., `CopyCommandInstructions` not just `Instructions`)
- Reflect the semantic meaning, not the visual appearance
- Group related elements with consistent prefixes when helpful
- These semantic CSS classnames won't have any actual styles or CSS rules attached to them.
  These are just used for debugging and as selectors.

## Antipattern: Unnecessary Page Navigations

The `page.goto` call does a full page navigation. In practice this adds a 3+ second delay
to the test. If the test has several of these, it will time out (default timeout is 15 seconds total).

```typescript
    // DON'T do this:
    await page.goto(`${WebRootUrl}/app`); // <-- This is unnecessary
    await page.goto(`${WebRootUrl}/app/add-integration`)
```

Instead, go directly to the target page whenever possible:

```typescript
    // This is better. Single `goto` that goes straight to the target page:
    await page.goto(`${WebRootUrl}/app/add-integration`)
```
