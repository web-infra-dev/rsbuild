import { describe, it, expect } from 'vitest';
import { Algorithm } from '../../src/common';

describe('test src/common/algorithm.ts', () => {
  it('mergeIntervals', () => {
    expect(Algorithm.mergeIntervals([[1, 3]])).toStrictEqual([[1, 3]]);

    expect(
      Algorithm.mergeIntervals([
        [1, 3],
        [2, 6],
        [8, 10],
        [15, 18],
      ]),
    ).toStrictEqual([
      [1, 6],
      [8, 10],
      [15, 18],
    ]);

    expect(
      Algorithm.mergeIntervals([
        [1, 3],
        [2, 6],
        [6, 8],
        [8, 10],
        [15, 18],
      ]),
    ).toStrictEqual([
      [1, 10],
      [15, 18],
    ]);
  });

  it('compressText & decompressText', () => {
    expect(Algorithm.decompressText(Algorithm.compressText('hello'))).toEqual(
      'hello',
    );
  });

  it('random', () => {
    [
      [0, 10],
      [10, 100],
      [100, 1000],
      [1000, 1000],
      [1000, 10000],
      [3000, 9000],
      [1234, 5678],
    ].forEach((arr) => {
      const [min, max] = arr;
      const number = Algorithm.random(min, max);
      expect(number).toBeGreaterThanOrEqual(min);
      expect(number).toBeLessThanOrEqual(max);
    });
  });
});
