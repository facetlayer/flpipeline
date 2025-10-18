import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { getRelevantHints, FoundHints } from '../getRelevantHints.js';
import { MockLLMService } from './mock-llm-service.js';

describe('getRelevantHints', () => {
  let testDir: string;

  beforeAll(() => {
    // Create a temporary test directory
    testDir = join(tmpdir(), `hint-db-relevant-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });

    // Create test markdown files with frontmatter
    writeFileSync(
      join(testDir, 'react-best-practices.md'),
      `---
description: Best practices for React development
---

# React Best Practices
`
    );

    writeFileSync(
      join(testDir, 'typescript-setup.md'),
      `---
description: How to set up TypeScript projects
---

# TypeScript Setup
`
    );

    writeFileSync(
      join(testDir, 'nextjs-guide.md'),
      `---
description: Guide for Next.js projects
---

# Next.js Guide
`
    );
  });

  afterAll(() => {
    // Clean up test directory
    if (testDir) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('FoundHints class', () => {
    it('should create FoundHints with hint names', () => {
      const hints = new FoundHints(['hint1', 'hint2'], testDir);
      expect(hints.getHintNames()).toEqual(['hint1', 'hint2']);
      expect(hints.getCount()).toBe(2);
      expect(hints.hasHints()).toBe(true);
    });

    it('should handle empty hints', () => {
      const hints = new FoundHints([]);
      expect(hints.getHintNames()).toEqual([]);
      expect(hints.getCount()).toBe(0);
      expect(hints.hasHints()).toBe(false);
    });

    it('should get hint content', () => {
      const hints = new FoundHints(['react-best-practices'], testDir);
      const content = hints.getHintContent('react-best-practices');
      expect(content).toContain('React Best Practices');
      expect(content).toContain('description: Best practices for React development');
    });

    it('should throw error for non-existent hint', () => {
      const hints = new FoundHints(['nonexistent'], testDir);
      expect(() => hints.getHintContent('nonexistent')).toThrow();
    });

    it('should get all hint contents', () => {
      const hints = new FoundHints(['react-best-practices', 'typescript-setup'], testDir);
      const contents = hints.getAllHintContents();
      expect(contents).toHaveLength(2);
      expect(contents[0].name).toBe('react-best-practices');
      expect(contents[0].content).toContain('React Best Practices');
      expect(contents[1].name).toBe('typescript-setup');
      expect(contents[1].content).toContain('TypeScript Setup');
    });

    it('should get concatenated content', () => {
      const hints = new FoundHints(['react-best-practices', 'typescript-setup'], testDir);
      const concatenated = hints.getConcatenatedContent();
      expect(concatenated).toContain('# react-best-practices');
      expect(concatenated).toContain('# typescript-setup');
      expect(concatenated).toContain('---');
    });
  });

  describe('getRelevantHints function', () => {
    it('should return empty FoundHints when no hint files exist', async () => {
      const mockLLM = new MockLLMService('[]');
      const foundHints = await getRelevantHints('test query', {
        patterns: [join(testDir, 'nonexistent/**/*.md')],
        llmService: mockLLM
      });

      expect(foundHints.getCount()).toBe(0);
      expect(foundHints.hasHints()).toBe(false);
    });

    it('should use LLM service to select relevant hints', async () => {
      const mockLLM = new MockLLMService('["react-best-practices"]');
      const foundHints = await getRelevantHints('I need React help', {
        patterns: [join(testDir, '*.md')],
        llmService: mockLLM,
        maxHints: 1
      });

      expect(foundHints.getCount()).toBe(1);
      expect(foundHints.getHintNames()).toContain('react-best-practices');
    });

    it('should handle multiple hints returned by LLM', async () => {
      const mockLLM = new MockLLMService('["react-best-practices", "typescript-setup"]');
      const foundHints = await getRelevantHints('React and TypeScript', {
        patterns: [join(testDir, '*.md')],
        llmService: mockLLM
      });

      expect(foundHints.getCount()).toBe(2);
      expect(foundHints.getHintNames()).toContain('react-best-practices');
      expect(foundHints.getHintNames()).toContain('typescript-setup');
    });

    it('should filter out invalid hint names from LLM response', async () => {
      const mockLLM = new MockLLMService('["react-best-practices", "invalid-hint", "typescript-setup"]');
      const foundHints = await getRelevantHints('test query', {
        patterns: [join(testDir, '*.md')],
        llmService: mockLLM
      });

      expect(foundHints.getCount()).toBe(2);
      expect(foundHints.getHintNames()).toContain('react-best-practices');
      expect(foundHints.getHintNames()).toContain('typescript-setup');
      expect(foundHints.getHintNames()).not.toContain('invalid-hint');
    });

    it('should respect maxHints option', async () => {
      const mockLLM = new MockLLMService('["react-best-practices", "typescript-setup", "nextjs-guide"]');
      const foundHints = await getRelevantHints('test query', {
        patterns: [join(testDir, '*.md')],
        llmService: mockLLM,
        maxHints: 2
      });

      expect(foundHints.getCount()).toBe(2);
    });

    it('should handle LLM response with extra text around JSON', async () => {
      const mockLLM = new MockLLMService(
        'Here are the relevant hints: ["react-best-practices"]\n\nThese should help.'
      );
      const foundHints = await getRelevantHints('test query', {
        patterns: [join(testDir, '*.md')],
        llmService: mockLLM
      });

      expect(foundHints.getCount()).toBe(1);
      expect(foundHints.getHintNames()).toContain('react-best-practices');
    });

    it('should return empty results when LLM returns no valid hints', async () => {
      const mockLLM = new MockLLMService('["nonexistent1", "nonexistent2"]');
      const foundHints = await getRelevantHints('test query', {
        patterns: [join(testDir, '*.md')],
        llmService: mockLLM,
        maxHints: 2
      });

      // Should return empty when no valid hints found
      expect(foundHints.getCount()).toBe(0);
      expect(foundHints.hasHints()).toBe(false);
    });

    it('should throw error when LLM service fails', async () => {
      const mockLLM = new MockLLMService('', true); // shouldFail = true

      await expect(
        getRelevantHints('test query', {
          patterns: [join(testDir, '*.md')],
          llmService: mockLLM
        })
      ).rejects.toThrow();
    });

    it('should throw error when LLM returns invalid JSON', async () => {
      const mockLLM = new MockLLMService('This is not JSON at all');

      await expect(
        getRelevantHints('test query', {
          patterns: [join(testDir, '*.md')],
          llmService: mockLLM
        })
      ).rejects.toThrow('Failed to parse hint selection from LLM');
    });

    it('should pass model and temperature options to LLM service', async () => {
      let capturedOptions: any = null;

      class CapturingMockLLM extends MockLLMService {
        async generate(prompt: string, options?: any): Promise<any> {
          capturedOptions = options;
          return super.generate(prompt, options);
        }
      }

      const mockLLM = new CapturingMockLLM('["react-best-practices"]');
      await getRelevantHints('test query', {
        patterns: [join(testDir, '*.md')],
        llmService: mockLLM,
        model: 'custom-model',
        temperature: 0.7
      });

      expect(capturedOptions).toMatchObject({
        model: 'custom-model',
        temperature: 0.7
      });
    });
  });
});
