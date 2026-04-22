import { describe, it, expect } from 'vitest';
import { buildXfadeFilterGraph, XFADE_DURATION, XFADE_MAP } from './transitions.js';

describe('XFADE_MAP', () => {
  it('maps dissolve to dissolve', () => expect(XFADE_MAP['dissolve']).toBe('dissolve'));
  it('maps fade to fade', () => expect(XFADE_MAP['fade']).toBe('fade'));
  it('maps wipe to wipeleft', () => expect(XFADE_MAP['wipe']).toBe('wipeleft'));
  it('maps zoom to zoomin', () => expect(XFADE_MAP['zoom']).toBe('zoomin'));
  it('does not map cut or none', () => {
    expect(XFADE_MAP['cut']).toBeUndefined();
    expect(XFADE_MAP['none']).toBeUndefined();
  });
});

describe('XFADE_DURATION', () => {
  it('defaults to 0.5 seconds', () => {
    expect(XFADE_DURATION).toBe(0.5);
  });
});

describe('buildXfadeFilterGraph', () => {
  describe('edge cases', () => {
    it('returns empty filters for fewer than 2 clips', () => {
      const result = buildXfadeFilterGraph([], [], []);
      expect(result.vFilters).toEqual([]);
      expect(result.aFilters).toEqual([]);
    });

    it('returns empty filters for exactly 1 clip', () => {
      const result = buildXfadeFilterGraph([5], ['cut'], []);
      expect(result.vFilters).toEqual([]);
      expect(result.aFilters).toEqual([]);
    });
  });

  describe('cut transitions (concat-based)', () => {
    it('builds concat filter for two clips with cut transition', () => {
      const durations = [5, 5];
      const transitions = ['cut'] as const;
      const { vFilters, aFilters } = buildXfadeFilterGraph(durations, transitions);

      expect(vFilters).toHaveLength(1);
      expect(aFilters).toHaveLength(1);
      expect(vFilters[0]).toContain('concat');
      expect(aFilters[0]).toContain('concat');
    });

    it('builds concat filter for two clips with none transition', () => {
      const durations = [5, 5];
      const transitions = ['none'] as const;
      const { vFilters, aFilters } = buildXfadeFilterGraph(durations, transitions);

      expect(vFilters[0]).toContain('concat');
    });

    it('generates correct labels for a 3-clip concat chain', () => {
      const durations = [5, 5, 5];
      const transitions = ['cut', 'cut'] as const;
      const { vFilters, aFilters } = buildXfadeFilterGraph(durations, transitions);

      expect(vFilters).toHaveLength(2);
      expect(aFilters).toHaveLength(2);
      // Intermediate label
      expect(vFilters[0]).toContain('[v1]');
      // Final label
      expect(vFilters[1]).toContain('[vout]');
    });
  });

  describe('xfade transitions', () => {
    it('builds xfade filter for dissolve transition', () => {
      const durations = [10, 10];
      const transitions = ['dissolve'] as const;
      const { vFilters, aFilters } = buildXfadeFilterGraph(durations, transitions);

      expect(vFilters[0]).toContain('xfade=transition=dissolve');
      expect(aFilters[0]).toContain('acrossfade');
    });

    it('builds xfade filter for fade transition', () => {
      const durations = [10, 10];
      const transitions = ['fade'] as const;
      const { vFilters } = buildXfadeFilterGraph(durations, transitions);

      expect(vFilters[0]).toContain('xfade=transition=fade');
    });

    it('builds xfade filter for wipe transition', () => {
      const durations = [10, 10];
      const transitions = ['wipe'] as const;
      const { vFilters } = buildXfadeFilterGraph(durations, transitions);

      expect(vFilters[0]).toContain('xfade=transition=wipeleft');
    });

    it('builds xfade filter for zoom transition', () => {
      const durations = [10, 10];
      const transitions = ['zoom'] as const;
      const { vFilters } = buildXfadeFilterGraph(durations, transitions);

      expect(vFilters[0]).toContain('xfade=transition=zoomin');
    });

    it('falls back to concat when clips are too short for xfade', () => {
      // Duration of 0.5 — xfade of 0.5s requires >=1.0s per clip (xDur * 2)
      const durations = [0.5, 0.5];
      const transitions = ['dissolve'] as const;
      const { vFilters } = buildXfadeFilterGraph(durations, transitions);

      // Should fall back to concat
      expect(vFilters[0]).toContain('concat');
    });

    it('uses custom default duration when provided', () => {
      const durations = [10, 10];
      const transitions = ['dissolve'] as const;
      const { vFilters } = buildXfadeFilterGraph(durations, transitions, undefined, undefined, 1.5);

      expect(vFilters[0]).toContain('duration=1.5');
    });

    it('uses per-transition custom durations', () => {
      const durations = [10, 10, 10];
      const transitions = ['dissolve', 'fade'] as const;
      const transitionDurations = [1.0, 2.0];
      const { vFilters } = buildXfadeFilterGraph(durations, transitions, transitionDurations);

      // Number(1.0).toString() === "1" in JS, so the filter has "duration=1" not "duration=1.0"
      expect(vFilters[0]).toContain('duration=1');
      expect(vFilters[1]).toContain('duration=2');
    });

    it('includes offset in xfade filter', () => {
      const durations = [10, 10];
      const transitions = ['dissolve'] as const;
      const { vFilters } = buildXfadeFilterGraph(durations, transitions);

      expect(vFilters[0]).toMatch(/offset=[\d.]+/);
    });

    it('uses [vout] and [aout] labels on last clip', () => {
      const durations = [10, 10];
      const transitions = ['dissolve'] as const;
      const { vFilters, aFilters } = buildXfadeFilterGraph(durations, transitions);

      expect(vFilters[vFilters.length - 1]).toContain('[vout]');
      expect(aFilters[aFilters.length - 1]).toContain('[aout]');
    });
  });

  describe('beat snapping', () => {
    it('snaps xfade offset to nearest beat within tolerance', () => {
      // Duration 10s, one dissolve. Without beats, offset = 10 - 0.5 = 9.5.
      // Provide a beat at 9.6 — dist 0.1 < BEAT_SNAP_TOLERANCE (0.4) → snapped to 9.6
      const durations = [10, 10];
      const transitions = ['dissolve'] as const;
      const beats = [9.6];
      const { vFilters } = buildXfadeFilterGraph(durations, transitions, undefined, beats);

      expect(vFilters[0]).toContain('offset=9.600');
    });

    it('does not snap when nearest beat is outside tolerance', () => {
      // offset = 9.5, nearest beat = 1.0 — dist 8.5 > 0.4
      const durations = [10, 10];
      const transitions = ['dissolve'] as const;
      const beats = [1.0];
      const { vFilters } = buildXfadeFilterGraph(durations, transitions, undefined, beats);

      expect(vFilters[0]).toContain('offset=9.500');
    });

    it('uses original offset when beat array is empty', () => {
      const durations = [10, 10];
      const transitions = ['dissolve'] as const;
      const { vFilters } = buildXfadeFilterGraph(durations, transitions, undefined, []);

      expect(vFilters[0]).toContain('offset=9.500');
    });
  });

  describe('mixed transitions', () => {
    it('mixes xfade and concat transitions in the same chain', () => {
      const durations = [10, 10, 10];
      const transitions = ['dissolve', 'cut'] as const;
      const { vFilters, aFilters } = buildXfadeFilterGraph(durations, transitions);

      expect(vFilters[0]).toContain('xfade');
      expect(vFilters[1]).toContain('concat');
      expect(aFilters).toHaveLength(2);
    });
  });

  describe('null/undefined durations', () => {
    it('treats null/undefined clip duration as 5 seconds', () => {
      const durations = [null as unknown as number, null as unknown as number];
      const transitions = ['cut'] as const;
      const { vFilters } = buildXfadeFilterGraph(durations, transitions);

      expect(vFilters).toHaveLength(1);
    });
  });
});
