import { describe, it, expect, vi } from 'vitest';
import { runWithConcurrency } from './concurrency.js';

describe('runWithConcurrency', () => {
  it('processes all items', async () => {
    const results: number[] = [];
    await runWithConcurrency([1, 2, 3, 4, 5], 2, async (item) => {
      results.push(item);
    });
    expect(results.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('resolves immediately for an empty array', async () => {
    const worker = vi.fn(async () => {});
    await runWithConcurrency([], 3, worker);
    expect(worker).not.toHaveBeenCalled();
  });

  it('passes the correct item and index to the worker', async () => {
    const calls: Array<[string, number]> = [];
    await runWithConcurrency(['a', 'b', 'c'], 2, async (item, index) => {
      calls.push([item, index]);
    });
    expect(calls.sort((a, b) => a[1] - b[1])).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);
  });

  it('respects concurrency=1 (sequential)', async () => {
    const order: number[] = [];
    let inFlight = 0;
    let maxInFlight = 0;

    await runWithConcurrency([0, 1, 2, 3, 4], 1, async (item) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise<void>(resolve => setTimeout(resolve, 5));
      order.push(item);
      inFlight--;
    });

    // With concurrency=1 items must finish in order
    expect(order).toEqual([0, 1, 2, 3, 4]);
    expect(maxInFlight).toBe(1);
  });

  it('runs up to concurrency limit in parallel', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const items = [0, 1, 2, 3, 4, 5, 6, 7];

    await runWithConcurrency(items, 3, async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise<void>(resolve => setTimeout(resolve, 10));
      inFlight--;
    });

    expect(maxInFlight).toBeLessThanOrEqual(3);
    expect(maxInFlight).toBeGreaterThan(1);
  });

  it('clamps concurrency to at least 1 even when 0 is passed', async () => {
    const results: number[] = [];
    await runWithConcurrency([10, 20, 30], 0, async (item) => {
      results.push(item);
    });
    expect(results.sort((a, b) => a - b)).toEqual([10, 20, 30]);
  });

  it('clamps negative concurrency to 1', async () => {
    const results: number[] = [];
    await runWithConcurrency([1, 2], -5, async (item) => {
      results.push(item);
    });
    expect(results.sort((a, b) => a - b)).toEqual([1, 2]);
  });

  it('handles non-integer concurrency by flooring', async () => {
    let maxInFlight = 0;
    let inFlight = 0;
    const items = Array.from({ length: 6 }, (_, i) => i);

    await runWithConcurrency(items, 2.9, async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise<void>(resolve => setTimeout(resolve, 5));
      inFlight--;
    });

    // floor(2.9) = 2
    expect(maxInFlight).toBeLessThanOrEqual(2);
  });

  it('propagates worker errors', async () => {
    await expect(
      runWithConcurrency([1, 2, 3], 2, async (item) => {
        if (item === 2) throw new Error('worker failed on 2');
      }),
    ).rejects.toThrow('worker failed on 2');
  });

  it('handles a single item', async () => {
    const results: number[] = [];
    await runWithConcurrency([42], 5, async (item) => {
      results.push(item);
    });
    expect(results).toEqual([42]);
  });

  it('handles concurrency larger than item count', async () => {
    const results: number[] = [];
    await runWithConcurrency([1, 2], 100, async (item) => {
      results.push(item);
    });
    expect(results.sort((a, b) => a - b)).toEqual([1, 2]);
  });
});
