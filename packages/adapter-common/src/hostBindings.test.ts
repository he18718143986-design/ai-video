import { describe, it, expect, beforeEach } from 'vitest';
import { registerAdapterHostBindings, getAdapterHostBindings } from './hostBindings.js';
import type { AdapterHostBindings } from './hostBindings.js';

function makeMockBindings(overrides: Partial<AdapterHostBindings> = {}): AdapterHostBindings {
  return {
    extractLatestImage: async () => null,
    tts: {
      generateSpeech: async () => ({ text: 'speech-result' }),
      isEdgeTTSAvailable: () => false,
    },
    quota: {
      on: () => () => {},
      emit: () => {},
    },
    capabilityQuota: {
      allExhausted: () => false,
      markExhausted: () => {},
    },
    hasQuotaSignal: () => false,
    timeouts: {
      chatResponseTimeoutMs: 30_000,
      maxContinuations: 10,
      pollinationsMaxAttempts: 3,
      pollinationsFetchTimeoutMs: 15_000,
    },
    httpProxy: undefined,
    defaultTextProvider: 'gemini',
    defaultImageProvider: 'pollinations',
    ...overrides,
  } as AdapterHostBindings;
}

describe('hostBindings', () => {
  beforeEach(() => {
    // Register fresh bindings before each test so module state is predictable
    registerAdapterHostBindings(makeMockBindings());
  });

  describe('registerAdapterHostBindings / getAdapterHostBindings', () => {
    it('returns the bindings that were registered', () => {
      const mock = makeMockBindings({ defaultTextProvider: 'openai' });
      registerAdapterHostBindings(mock);
      expect(getAdapterHostBindings()).toBe(mock);
    });

    it('getAdapterHostBindings returns the most-recently-registered bindings', () => {
      const first = makeMockBindings({ defaultTextProvider: 'gemini' });
      const second = makeMockBindings({ defaultTextProvider: 'openai' });
      registerAdapterHostBindings(first);
      registerAdapterHostBindings(second);
      expect(getAdapterHostBindings().defaultTextProvider).toBe('openai');
    });

    it('returned bindings expose the expected timeouts shape', () => {
      const bindings = getAdapterHostBindings();
      expect(typeof bindings.timeouts.chatResponseTimeoutMs).toBe('number');
      expect(typeof bindings.timeouts.maxContinuations).toBe('number');
      expect(typeof bindings.timeouts.pollinationsMaxAttempts).toBe('number');
      expect(typeof bindings.timeouts.pollinationsFetchTimeoutMs).toBe('number');
    });

    it('returned bindings expose tts functions', () => {
      const bindings = getAdapterHostBindings();
      expect(typeof bindings.tts.generateSpeech).toBe('function');
      expect(typeof bindings.tts.isEdgeTTSAvailable).toBe('function');
    });

    it('returned bindings expose quota functions', () => {
      const bindings = getAdapterHostBindings();
      expect(typeof bindings.quota.on).toBe('function');
      expect(typeof bindings.quota.emit).toBe('function');
    });

    it('returned bindings expose capabilityQuota functions', () => {
      const bindings = getAdapterHostBindings();
      expect(typeof bindings.capabilityQuota.allExhausted).toBe('function');
      expect(typeof bindings.capabilityQuota.markExhausted).toBe('function');
    });

    it('returned bindings expose hasQuotaSignal function', () => {
      const bindings = getAdapterHostBindings();
      expect(typeof bindings.hasQuotaSignal).toBe('function');
    });
  });
});
