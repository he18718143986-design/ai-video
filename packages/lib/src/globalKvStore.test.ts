import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGlobalKVStore } from './globalKvStore.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('createGlobalKVStore', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'global-kv-test-'));
  });

  afterEach(() => {
    // Restore env var after each test
    delete process.env.GLOBAL_STORE_BACKEND;
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  });

  describe('backend=json (default)', () => {
    it('creates a json-backed store when backend is not specified', () => {
      const store = createGlobalKVStore(tmpDir);
      expect(store).toBeDefined();
      // JsonKVStore can read/write values
    });

    it('creates a json-backed store when backend="json" is explicit', () => {
      const store = createGlobalKVStore(tmpDir, { backend: 'json' });
      expect(store).toBeDefined();
    });

    it('creates a json-backed store when GLOBAL_STORE_BACKEND env var is not set', () => {
      delete process.env.GLOBAL_STORE_BACKEND;
      const store = createGlobalKVStore(tmpDir);
      expect(store).toBeDefined();
    });

    it('creates a json-backed store when GLOBAL_STORE_BACKEND=json', () => {
      process.env.GLOBAL_STORE_BACKEND = 'json';
      const store = createGlobalKVStore(tmpDir);
      expect(store).toBeDefined();
    });

    it('json store supports round-trip get/set', async () => {
      const store = createGlobalKVStore(tmpDir, { backend: 'json' });
      await store.set('testKey', { hello: 'world' });
      const value = await store.get('testKey');
      expect(value).toEqual({ hello: 'world' });
    });

    it('json store returns undefined for missing keys', async () => {
      const store = createGlobalKVStore(tmpDir, { backend: 'json' });
      const value = await store.get('nonExistentKey');
      expect(value).toBeUndefined();
    });
  });

  describe('backend=sqlite', () => {
    it('creates a sqlite-backed store when backend="sqlite" is explicit', () => {
      const store = createGlobalKVStore(tmpDir, { backend: 'sqlite' });
      expect(store).toBeDefined();
    });

    it('creates a sqlite-backed store when GLOBAL_STORE_BACKEND=sqlite', () => {
      process.env.GLOBAL_STORE_BACKEND = 'sqlite';
      const store = createGlobalKVStore(tmpDir);
      expect(store).toBeDefined();
    });

    it('sqlite store supports round-trip get/set', async () => {
      const store = createGlobalKVStore(tmpDir, { backend: 'sqlite' });
      await store.set('sqliteKey', { count: 42 });
      const value = await store.get('sqliteKey');
      expect(value).toEqual({ count: 42 });
    });

    it('sqlite store returns undefined for missing keys', async () => {
      const store = createGlobalKVStore(tmpDir, { backend: 'sqlite' });
      const value = await store.get('missingKey');
      expect(value).toBeUndefined();
    });

    it('uses a custom dbFileName when specified', () => {
      const store = createGlobalKVStore(tmpDir, { backend: 'sqlite', dbFileName: 'custom.db' });
      expect(store).toBeDefined();
    });
  });

  describe('env-var precedence', () => {
    it('option.backend takes precedence over GLOBAL_STORE_BACKEND env var', async () => {
      process.env.GLOBAL_STORE_BACKEND = 'sqlite';
      // Explicit 'json' should override the env var
      const store = createGlobalKVStore(tmpDir, { backend: 'json' });
      await store.set('envKey', 'envValue');
      const value = await store.get('envKey');
      expect(value).toBe('envValue');
    });
  });
});
