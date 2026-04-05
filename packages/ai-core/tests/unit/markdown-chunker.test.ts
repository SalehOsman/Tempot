import { describe, it, expect } from 'vitest';
import { chunkMarkdown } from '../../src/chunking/markdown-chunker.js';

describe('chunkMarkdown', () => {
  describe('heading-based splitting', () => {
    it('splits at ## heading boundaries', () => {
      const markdown = [
        '## Introduction',
        'This is the intro section.',
        '',
        '## Getting Started',
        'This is the getting started section.',
      ].join('\n');

      const result = chunkMarkdown(markdown, { filePath: 'en/guide.md' });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks).toHaveLength(2);
      expect(chunks[0].metadata['section']).toBe('Introduction');
      expect(chunks[1].metadata['section']).toBe('Getting Started');
    });

    it('splits at ### heading boundaries', () => {
      const markdown = [
        '## Main Section',
        'Intro text.',
        '',
        '### Sub Section A',
        'Content A.',
        '',
        '### Sub Section B',
        'Content B.',
      ].join('\n');

      const result = chunkMarkdown(markdown, { filePath: 'en/guide.md' });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks).toHaveLength(3);
      expect(chunks[0].metadata['section']).toBe('Main Section');
      expect(chunks[1].metadata['section']).toBe('Sub Section A');
      expect(chunks[2].metadata['section']).toBe('Sub Section B');
    });
  });

  describe('metadata enrichment', () => {
    it('includes filePath in chunk metadata', () => {
      const markdown = '## Overview\nSome content.';
      const result = chunkMarkdown(markdown, { filePath: 'en/concepts/overview.md' });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks[0].metadata['filePath']).toBe('en/concepts/overview.md');
    });

    it('includes section title in metadata', () => {
      const markdown = '## Architecture\nDetails about architecture.';
      const result = chunkMarkdown(markdown, { filePath: 'en/guide.md' });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks[0].metadata['section']).toBe('Architecture');
    });

    it('derives language from filePath (en)', () => {
      const markdown = '## Overview\nContent.';
      const result = chunkMarkdown(markdown, { filePath: 'en/guide.md' });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks[0].metadata['language']).toBe('en');
    });

    it('derives language from filePath (ar)', () => {
      const markdown = '## نظرة عامة\nمحتوى.';
      const result = chunkMarkdown(markdown, { filePath: 'ar/guide.md' });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks[0].metadata['language']).toBe('ar');
    });
  });

  describe('frontmatter handling', () => {
    it('excludes YAML frontmatter from chunks', () => {
      const markdown = [
        '---',
        'title: My Doc',
        'description: Test',
        '---',
        '',
        '## Content Section',
        'Actual content here.',
      ].join('\n');

      const result = chunkMarkdown(markdown, { filePath: 'en/guide.md' });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).not.toContain('---');
      expect(chunks[0].text).not.toContain('title: My Doc');
      expect(chunks[0].text).toContain('Actual content here.');
    });
  });

  describe('empty section handling', () => {
    it('skips empty sections', () => {
      const markdown = [
        '## Non-Empty',
        'Has content.',
        '',
        '## Empty',
        '',
        '## Also Non-Empty',
        'Also has content.',
      ].join('\n');

      const result = chunkMarkdown(markdown, { filePath: 'en/guide.md' });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks).toHaveLength(2);
      expect(chunks[0].metadata['section']).toBe('Non-Empty');
      expect(chunks[1].metadata['section']).toBe('Also Non-Empty');
    });
  });

  describe('chunk indexing', () => {
    it('sets chunkIndex and totalChunks correctly', () => {
      const markdown = [
        '## Section One',
        'Content one.',
        '',
        '## Section Two',
        'Content two.',
        '',
        '## Section Three',
        'Content three.',
      ].join('\n');

      const result = chunkMarkdown(markdown, { filePath: 'en/guide.md' });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks).toHaveLength(3);
      for (let i = 0; i < chunks.length; i++) {
        expect(chunks[i].chunkIndex).toBe(i);
        expect(chunks[i].totalChunks).toBe(3);
      }
    });
  });

  describe('large section splitting', () => {
    it('splits sections exceeding token limit at paragraph boundaries', () => {
      // Default token limit is 8000 → ~32000 chars
      // Create a section with content larger than that
      const paragraphs: string[] = [];
      for (let i = 0; i < 200; i++) {
        paragraphs.push(`Paragraph ${i}: ${'word '.repeat(50)}`);
      }
      const markdown = `## Large Section\n\n${paragraphs.join('\n\n')}`;

      const result = chunkMarkdown(markdown, { filePath: 'en/guide.md' });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks.length).toBeGreaterThan(1);

      // All chunks should reference the same section
      for (const chunk of chunks) {
        expect(chunk.metadata['section']).toBe('Large Section');
      }
    });
  });

  describe('content without headings', () => {
    it('treats content without headings as a single section', () => {
      const markdown = 'Just some content without any headings.\n\nAnother paragraph.';
      const result = chunkMarkdown(markdown, { filePath: 'en/guide.md' });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks).toHaveLength(1);
      expect(chunks[0].metadata['section']).toBe('(untitled)');
    });
  });

  describe('custom token limit', () => {
    it('respects custom maxTokensPerChunk option', () => {
      // Create content that would be 1 chunk at 8000 tokens but multiple at 100
      const paragraphs: string[] = [];
      for (let i = 0; i < 20; i++) {
        paragraphs.push(`Paragraph ${i}: ${'word '.repeat(30)}`);
      }
      const markdown = `## Test Section\n\n${paragraphs.join('\n\n')}`;

      const result = chunkMarkdown(markdown, {
        filePath: 'en/guide.md',
        maxTokensPerChunk: 100,
      });
      expect(result.isOk()).toBe(true);

      const chunks = result._unsafeUnwrap();
      expect(chunks.length).toBeGreaterThan(1);
    });
  });
});
