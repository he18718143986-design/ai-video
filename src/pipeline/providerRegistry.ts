/* ------------------------------------------------------------------ */
/*  ProviderCapabilityRegistry – dynamic provider capability tracking */
/*  Replaces hardcoded 'provider: gemini' in quality router with     */
/*  runtime-detected capability data.                                 */
/* ------------------------------------------------------------------ */

import type { ProviderId } from '../types.js';

/** Capabilities a provider can support. */
export interface ProviderCapability {
  providerId: ProviderId;
  /** Provider supports text generation. */
  text: boolean;
  /** Provider supports image generation in chat. */
  imageGeneration: boolean;
  /** Provider supports video generation. */
  videoGeneration: boolean;
  /** Provider supports file upload (video/image/document). */
  fileUpload: boolean;
  /** Provider has built-in web search (Google Search grounding). */
  webSearch: boolean;
  /** Provider supports TTS / speech generation. */
  tts: boolean;
  /** Detected models available for this provider. */
  models: string[];
  /** Whether quota is currently exhausted. */
  quotaExhausted: boolean;
  /** ISO timestamp of last probe. */
  lastProbed?: string;
  /** Free tier daily limits (if known). */
  dailyLimits?: {
    textQueries?: number;
    imageGenerations?: number;
    videoGenerations?: number;
  };
}

/** Default capabilities for known built-in providers. */
const BUILTIN_CAPABILITIES: Record<string, Omit<ProviderCapability, 'providerId'>> = {
  gemini: {
    text: true,
    imageGeneration: true,
    videoGeneration: false,
    fileUpload: true,
    webSearch: true,
    tts: false,
    models: [],
    quotaExhausted: false,
    dailyLimits: { textQueries: 50, imageGenerations: 10 },
  },
  chatgpt: {
    text: true,
    imageGeneration: true,
    videoGeneration: false,
    fileUpload: true,
    webSearch: true,
    tts: false,
    models: [],
    quotaExhausted: false,
    dailyLimits: { textQueries: 40 },
  },
  deepseek: {
    text: true,
    imageGeneration: false,
    videoGeneration: false,
    fileUpload: false,
    webSearch: true,
    tts: false,
    models: [],
    quotaExhausted: false,
    dailyLimits: { textQueries: 50 },
  },
  kimi: {
    text: true,
    imageGeneration: false,
    videoGeneration: false,
    fileUpload: true,
    webSearch: true,
    tts: false,
    models: [],
    quotaExhausted: false,
    dailyLimits: { textQueries: 50 },
  },
  seedance: {
    text: false,
    imageGeneration: false,
    videoGeneration: true,
    fileUpload: true,
    webSearch: false,
    tts: false,
    models: [],
    quotaExhausted: false,
    dailyLimits: { videoGenerations: 5 },
  },
};

/**
 * Registry that tracks provider capabilities at runtime.
 * Capabilities can be seeded from known defaults and updated
 * via dynamic probing or user feedback.
 */
export class ProviderCapabilityRegistry {
  private capabilities = new Map<string, ProviderCapability>();

  constructor() {
    // Seed with built-in defaults
    for (const [id, cap] of Object.entries(BUILTIN_CAPABILITIES)) {
      this.capabilities.set(id, { providerId: id, ...cap });
    }
  }

  /**
   * Get capability info for a provider.
   */
  get(providerId: string): ProviderCapability | undefined {
    return this.capabilities.get(providerId);
  }

  /**
   * Get all registered providers.
   */
  getAll(): ProviderCapability[] {
    return [...this.capabilities.values()];
  }

  /**
   * Register or update a provider's capabilities.
   */
  register(providerId: string, cap: Partial<Omit<ProviderCapability, 'providerId'>>): void {
    const existing = this.capabilities.get(providerId);
    if (existing) {
      Object.assign(existing, cap, { lastProbed: new Date().toISOString() });
    } else {
      this.capabilities.set(providerId, {
        providerId,
        text: cap.text ?? true,
        imageGeneration: cap.imageGeneration ?? false,
        videoGeneration: cap.videoGeneration ?? false,
        fileUpload: cap.fileUpload ?? false,
        webSearch: cap.webSearch ?? false,
        tts: cap.tts ?? false,
        models: cap.models ?? [],
        quotaExhausted: cap.quotaExhausted ?? false,
        lastProbed: new Date().toISOString(),
        dailyLimits: cap.dailyLimits,
      });
    }
  }

  /**
   * Mark a provider's quota as exhausted.
   */
  markQuotaExhausted(providerId: string): void {
    const cap = this.capabilities.get(providerId);
    if (cap) cap.quotaExhausted = true;
  }

  /**
   * Reset a provider's quota (e.g. after daily reset).
   */
  resetQuota(providerId: string): void {
    const cap = this.capabilities.get(providerId);
    if (cap) cap.quotaExhausted = false;
  }

  /**
   * Find the best provider for a specific capability need.
   * Returns providers sorted by availability (non-exhausted first).
   */
  findProviders(need: {
    text?: boolean;
    imageGeneration?: boolean;
    videoGeneration?: boolean;
    fileUpload?: boolean;
    webSearch?: boolean;
  }): ProviderCapability[] {
    const matches = [...this.capabilities.values()].filter((cap) => {
      if (need.text && !cap.text) return false;
      if (need.imageGeneration && !cap.imageGeneration) return false;
      if (need.videoGeneration && !cap.videoGeneration) return false;
      if (need.fileUpload && !cap.fileUpload) return false;
      if (need.webSearch && !cap.webSearch) return false;
      return true;
    });

    // Sort: non-exhausted first, then alphabetically
    return matches.sort((a, b) => {
      if (a.quotaExhausted !== b.quotaExhausted) {
        return a.quotaExhausted ? 1 : -1;
      }
      return a.providerId.localeCompare(b.providerId);
    });
  }

  /**
   * Serialize capabilities for persistence or API response.
   */
  toJSON(): Record<string, ProviderCapability> {
    const result: Record<string, ProviderCapability> = {};
    for (const [id, cap] of this.capabilities) {
      result[id] = { ...cap };
    }
    return result;
  }
}
