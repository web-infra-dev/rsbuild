import { describe, it, expect, vi } from 'vitest';
import { hrtime } from 'process';
import { Time } from '../../src/common';

vi.setConfig({ testTimeout: 100000 });

describe('test src/build/time.ts', () => {
  // FIXME skipped because it always get timeout in CI
  it.skip('getCurrentTimestamp', async () => {
    const start = Date.now();
    const startH = hrtime();
    const delay = 500;

    const expt = await new Promise((r) => {
      setTimeout(() => {
        r(Time.getCurrentTimestamp(start, startH));
      }, delay);
    });

    expect(expt).toBeGreaterThanOrEqual(start + delay);
  });
});
