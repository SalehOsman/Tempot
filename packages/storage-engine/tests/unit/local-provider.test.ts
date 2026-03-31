import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import { LocalProvider } from '../../src/providers/local.provider.js';
import { STORAGE_ERRORS } from '../../src/storage.errors.js';

describe('LocalProvider', () => {
  let provider: LocalProvider;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'storage-test-'));
    provider = new LocalProvider({ basePath: tempDir });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('upload', () => {
    it('should upload a Buffer and write to disk', async () => {
      const data = Buffer.from('hello world');
      const result = await provider.upload('test/file.txt', data, 'text/plain');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.providerKey).toBe('test/file.txt');
      }
      const content = await readFile(join(tempDir, 'test/file.txt'), 'utf-8');
      expect(content).toBe('hello world');
    });

    it('should upload a Readable stream and write to disk', async () => {
      const data = Readable.from(Buffer.from('stream content'));
      const result = await provider.upload('stream/file.txt', data, 'text/plain');
      expect(result.isOk()).toBe(true);
      const content = await readFile(join(tempDir, 'stream/file.txt'), 'utf-8');
      expect(content).toBe('stream content');
    });

    it('should create nested directories automatically', async () => {
      const data = Buffer.from('nested content');
      const result = await provider.upload('a/b/c/deep.txt', data, 'text/plain');
      expect(result.isOk()).toBe(true);
      const content = await readFile(join(tempDir, 'a/b/c/deep.txt'), 'utf-8');
      expect(content).toBe('nested content');
    });
  });

  describe('download', () => {
    it('should return a Readable stream for an existing file', async () => {
      const data = Buffer.from('download me');
      await provider.upload('dl/file.txt', data, 'text/plain');

      const result = await provider.download('dl/file.txt');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const chunks: Buffer[] = [];
        for await (const chunk of result.value) {
          chunks.push(Buffer.from(chunk as Buffer));
        }
        expect(Buffer.concat(chunks).toString()).toBe('download me');
      }
    });

    it('should return NOT_FOUND for missing file', async () => {
      const result = await provider.download('nonexistent.txt');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.NOT_FOUND);
      }
    });
  });

  describe('delete', () => {
    it('should delete an existing file', async () => {
      await provider.upload('del/file.txt', Buffer.from('bye'), 'text/plain');
      const result = await provider.delete('del/file.txt');
      expect(result.isOk()).toBe(true);

      const existsResult = await provider.exists('del/file.txt');
      expect(existsResult.isOk()).toBe(true);
      if (existsResult.isOk()) expect(existsResult.value).toBe(false);
    });

    it('should return DELETE_FAILED for missing file', async () => {
      const result = await provider.delete('nonexistent.txt');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.DELETE_FAILED);
      }
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await provider.upload('ex/file.txt', Buffer.from('x'), 'text/plain');
      const result = await provider.exists('ex/file.txt');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(true);
    });

    it('should return false for missing file (not an error)', async () => {
      const result = await provider.exists('missing.txt');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(false);
    });
  });

  describe('getSignedUrl', () => {
    it('should return local file path for existing file', async () => {
      await provider.upload('url/file.txt', Buffer.from('x'), 'text/plain');
      const result = await provider.getSignedUrl('url/file.txt', 3600);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(join(tempDir, 'url/file.txt'));
      }
    });

    it('should return NOT_FOUND for missing file', async () => {
      const result = await provider.getSignedUrl('missing.txt', 3600);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.NOT_FOUND);
      }
    });
  });
});
