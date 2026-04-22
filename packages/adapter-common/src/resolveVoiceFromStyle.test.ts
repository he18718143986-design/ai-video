import { describe, it, expect } from 'vitest';
import { resolveVoiceFromStyle, DEFAULT_VOICE_MAPPING } from './resolveVoiceFromStyle.js';

describe('resolveVoiceFromStyle', () => {
  describe('no voiceStyle provided', () => {
    it('returns the default voice when voiceStyle is undefined', () => {
      expect(resolveVoiceFromStyle()).toBe(DEFAULT_VOICE_MAPPING.defaultVoice);
    });

    it('returns the default voice when voiceStyle is empty string', () => {
      expect(resolveVoiceFromStyle('')).toBe(DEFAULT_VOICE_MAPPING.defaultVoice);
    });

    it('returns the default voice when voiceStyle is undefined and language is set', () => {
      expect(resolveVoiceFromStyle(undefined, 'English')).toBe(DEFAULT_VOICE_MAPPING.defaultVoice);
    });
  });

  describe('English language', () => {
    it('returns en.female for female voice style in English', () => {
      expect(resolveVoiceFromStyle('female voice', 'English')).toBe(DEFAULT_VOICE_MAPPING.en.female);
      expect(resolveVoiceFromStyle('woman narrator', 'English')).toBe(DEFAULT_VOICE_MAPPING.en.female);
    });

    it('returns en.male for male voice style in English', () => {
      expect(resolveVoiceFromStyle('male voice', 'English')).toBe(DEFAULT_VOICE_MAPPING.en.male);
      expect(resolveVoiceFromStyle('man narrator', 'English')).toBe(DEFAULT_VOICE_MAPPING.en.male);
    });

    it('returns en.maleDeep for deep or calm male voice in English', () => {
      expect(resolveVoiceFromStyle('male deep voice', 'English')).toBe(DEFAULT_VOICE_MAPPING.en.maleDeep);
      expect(resolveVoiceFromStyle('calm male narrator', 'English')).toBe(DEFAULT_VOICE_MAPPING.en.maleDeep);
    });

    it('returns en.female as default for English without explicit gender', () => {
      expect(resolveVoiceFromStyle('narrator', 'English')).toBe(DEFAULT_VOICE_MAPPING.en.female);
    });

    it('is case-insensitive for language detection', () => {
      expect(resolveVoiceFromStyle('female voice', 'english')).toBe(DEFAULT_VOICE_MAPPING.en.female);
      expect(resolveVoiceFromStyle('female voice', 'ENGLISH')).toBe(DEFAULT_VOICE_MAPPING.en.female);
    });
  });

  describe('Chinese language (default)', () => {
    it('returns zh.female for female voice style', () => {
      expect(resolveVoiceFromStyle('female voice')).toBe(DEFAULT_VOICE_MAPPING.zh.female);
      expect(resolveVoiceFromStyle('woman narrator')).toBe(DEFAULT_VOICE_MAPPING.zh.female);
    });

    it('returns zh.female for Chinese 女 keyword', () => {
      expect(resolveVoiceFromStyle('女声')).toBe(DEFAULT_VOICE_MAPPING.zh.female);
    });

    it('returns zh.femaleWarm for warm female voice', () => {
      expect(resolveVoiceFromStyle('warm female voice')).toBe(DEFAULT_VOICE_MAPPING.zh.femaleWarm);
      expect(resolveVoiceFromStyle('gentle woman voice')).toBe(DEFAULT_VOICE_MAPPING.zh.femaleWarm);
      expect(resolveVoiceFromStyle('温暖女声')).toBe(DEFAULT_VOICE_MAPPING.zh.femaleWarm);
    });

    it('returns zh.male for male voice style', () => {
      expect(resolveVoiceFromStyle('male voice')).toBe(DEFAULT_VOICE_MAPPING.zh.male);
      expect(resolveVoiceFromStyle('man narrator')).toBe(DEFAULT_VOICE_MAPPING.zh.male);
    });

    it('returns zh.male for Chinese 男 keyword', () => {
      expect(resolveVoiceFromStyle('男声')).toBe(DEFAULT_VOICE_MAPPING.zh.male);
    });

    it('returns zh.maleDeep for deep male voice', () => {
      expect(resolveVoiceFromStyle('male deep voice')).toBe(DEFAULT_VOICE_MAPPING.zh.maleDeep);
      expect(resolveVoiceFromStyle('low calm male')).toBe(DEFAULT_VOICE_MAPPING.zh.maleDeep);
    });

    it('returns zh.maleDeep for Chinese 低沉 / 沉稳 keywords', () => {
      expect(resolveVoiceFromStyle('低沉男声')).toBe(DEFAULT_VOICE_MAPPING.zh.maleDeep);
      expect(resolveVoiceFromStyle('沉稳男声')).toBe(DEFAULT_VOICE_MAPPING.zh.maleDeep);
    });

    it('returns default voice for unrecognised style without language', () => {
      expect(resolveVoiceFromStyle('neutral narrator')).toBe(DEFAULT_VOICE_MAPPING.defaultVoice);
    });
  });

  describe('custom mapping', () => {
    const customMapping = {
      defaultVoice: 'custom-default',
      en: { female: 'custom-en-f', maleDeep: 'custom-en-md', male: 'custom-en-m' },
      zh: { femaleWarm: 'custom-zh-fw', female: 'custom-zh-f', maleDeep: 'custom-zh-md', male: 'custom-zh-m' },
    };

    it('respects a provided mapping for English female', () => {
      expect(resolveVoiceFromStyle('female voice', 'English', customMapping)).toBe('custom-en-f');
    });

    it('respects a provided mapping for Chinese male deep', () => {
      expect(resolveVoiceFromStyle('deep male voice', undefined, customMapping)).toBe('custom-zh-md');
    });

    it('respects a provided mapping for the default voice', () => {
      expect(resolveVoiceFromStyle(undefined, undefined, customMapping)).toBe('custom-default');
    });
  });

  describe('DEFAULT_VOICE_MAPPING', () => {
    it('contains expected Azure Neural voice identifiers', () => {
      expect(DEFAULT_VOICE_MAPPING.defaultVoice).toBe('zh-CN-XiaoxiaoNeural');
      expect(DEFAULT_VOICE_MAPPING.en.female).toBe('en-US-JennyNeural');
      expect(DEFAULT_VOICE_MAPPING.en.maleDeep).toBe('en-US-GuyNeural');
      expect(DEFAULT_VOICE_MAPPING.en.male).toBe('en-US-ChristopherNeural');
      expect(DEFAULT_VOICE_MAPPING.zh.femaleWarm).toBe('zh-CN-XiaoyiNeural');
      expect(DEFAULT_VOICE_MAPPING.zh.female).toBe('zh-CN-XiaoxiaoNeural');
      expect(DEFAULT_VOICE_MAPPING.zh.maleDeep).toBe('zh-CN-YunjianNeural');
      expect(DEFAULT_VOICE_MAPPING.zh.male).toBe('zh-CN-YunxiNeural');
    });

    it('is frozen (immutable)', () => {
      expect(Object.isFrozen(DEFAULT_VOICE_MAPPING)).toBe(true);
      expect(Object.isFrozen(DEFAULT_VOICE_MAPPING.en)).toBe(true);
      expect(Object.isFrozen(DEFAULT_VOICE_MAPPING.zh)).toBe(true);
    });
  });
});
