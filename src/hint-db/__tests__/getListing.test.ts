import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { getListing } from '../getListing.js';

describe('getListing', () => {
  let testDir: string;

  beforeAll(() => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `hint-db-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Create test markdown files with frontmatter
    writeFileSync(
      join(testDir, 'test-hint-1.md'),
      `---
description: First test hint description
---

# Test Hint 1
This is the content of test hint 1.
`
    );

    writeFileSync(
      join(testDir, 'test-hint-2.md'),
      `---
description: Second test hint description
---

# Test Hint 2
This is the content of test hint 2.
`
    );

    writeFileSync(
      join(testDir, 'no-description.md'),
      `---
title: No Description File
---

# No Description
This file has no description in frontmatter.
`
    );

    writeFileSync(
      join(testDir, 'empty-frontmatter.md'),
      `---
---

# Empty Frontmatter
This file has empty frontmatter.
`
    );

    writeFileSync(
      join(testDir, 'no-frontmatter.md'),
      `# No Frontmatter
This file has no frontmatter at all.
`
    );

    // Create a subdirectory with more files
    const subDir = join(testDir, 'subdir');
    mkdirSync(subDir, { recursive: true });

    writeFileSync(
      join(subDir, 'nested-hint.md'),
      `---
description: Nested hint in subdirectory
---

# Nested Hint
`
    );

    // Create a non-markdown file (should be ignored)
    writeFileSync(
      join(testDir, 'not-markdown.txt'),
      `This is not a markdown file.`
    );
  });

  afterAll(() => {
    // Clean up test directory
    if (testDir) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should return listings for all markdown files with descriptions', async () => {
    const listing = await getListing({
      patterns: [join(testDir, '*.md')]
    });

    expect(listing.some(h => h.name === 'test-hint-1' && h.description === 'First test hint description')).toBe(true);
    expect(listing.some(h => h.name === 'test-hint-2' && h.description === 'Second test hint description')).toBe(true);
    expect(listing.length).toBeGreaterThan(0);
  });

  it('should handle files without description frontmatter', async () => {
    const listing = await getListing({
      patterns: [join(testDir, 'no-description.md')]
    });

    expect(listing).toHaveLength(1);
    expect(listing[0].name).toBe('no-description');
    expect(listing[0].description).toBe('No description available');
  });

  it('should handle files with empty frontmatter', async () => {
    const listing = await getListing({
      patterns: [join(testDir, 'empty-frontmatter.md')]
    });

    expect(listing).toHaveLength(1);
    expect(listing[0].name).toBe('empty-frontmatter');
    expect(listing[0].description).toBe('No description available');
  });

  it('should handle files with no frontmatter', async () => {
    const listing = await getListing({
      patterns: [join(testDir, 'no-frontmatter.md')]
    });

    expect(listing).toHaveLength(1);
    expect(listing[0].name).toBe('no-frontmatter');
    expect(listing[0].description).toBe('No description available');
  });

  it('should return sorted listings', async () => {
    const listing = await getListing({
      patterns: [join(testDir, '*.md')]
    });

    // Check that the listing is sorted alphabetically by name
    const names = listing.map(h => h.name);
    const sortedNames = [...names].sort();
    expect(names).toEqual(sortedNames);
  });

  it('should support glob patterns with subdirectories', async () => {
    const listing = await getListing({
      patterns: [join(testDir, '**/*.md')]
    });

    // Should include files from subdirectories
    expect(listing.some(h => h.name === 'nested-hint')).toBe(true);
    expect(listing.length).toBeGreaterThanOrEqual(6);
  });

  it('should support multiple glob patterns', async () => {
    const listing = await getListing({
      patterns: [
        join(testDir, 'test-hint-1.md'),
        join(testDir, 'test-hint-2.md')
      ]
    });

    expect(listing).toHaveLength(2);
    expect(listing.some(h => h.name === 'test-hint-1' && h.description === 'First test hint description')).toBe(true);
    expect(listing.some(h => h.name === 'test-hint-2' && h.description === 'Second test hint description')).toBe(true);
  });

  it('should deduplicate files when patterns overlap', async () => {
    const listing = await getListing({
      patterns: [
        join(testDir, '*.md'),
        join(testDir, 'test-hint-1.md')
      ]
    });

    // Count occurrences of test-hint-1
    const count = listing.filter(h => h.name === 'test-hint-1').length;
    expect(count).toBe(1);
  });

  it('should not include non-markdown files', async () => {
    const listing = await getListing({
      patterns: [join(testDir, '*.md')]
    });

    // Should not include the .txt file since we're only matching .md files
    expect(listing.every(h => h.name !== 'not-markdown')).toBe(true);
    // Verify we still have markdown files
    expect(listing.length).toBeGreaterThan(0);
  });

  it('should use default pattern when no options provided', async () => {
    // This will use the default PROJECT_ROOT_DIR/src/hints/**/*.md
    const listing = await getListing();

    // Should return the actual hints from the project
    expect(Array.isArray(listing)).toBe(true);
    // The project should have at least some hint files
    expect(listing.length).toBeGreaterThan(0);
  });

  it('should handle empty results gracefully', async () => {
    const listing = await getListing({
      patterns: [join(testDir, 'nonexistent/**/*.md')]
    });

    expect(listing).toEqual([]);
  });

  it('should return HintInfo objects with correct structure', async () => {
    const listing = await getListing({
      patterns: [join(testDir, 'test-hint-1.md')]
    });

    expect(listing).toHaveLength(1);
    expect(listing[0]).toHaveProperty('name', 'test-hint-1');
    expect(listing[0]).toHaveProperty('description');
    expect(typeof listing[0].description).toBe('string');
  });

  it('should extract relevant_for from frontmatter when present', async () => {
    // Create a hint with relevant_for
    writeFileSync(
      join(testDir, 'with-relevant.md'),
      `---
description: Test hint
relevant_for: Testing relevant_for extraction
---
Content`
    );

    const listing = await getListing({
      patterns: [join(testDir, 'with-relevant.md')]
    });

    expect(listing).toHaveLength(1);
    expect(listing[0].name).toBe('with-relevant');
    expect(listing[0].relevant_for).toBe('Testing relevant_for extraction');
  });
});
