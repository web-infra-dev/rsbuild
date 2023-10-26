import { describe, it, expect } from 'vitest';
import { Algorithm, Manifest } from '../../src/common';

describe('test src/common/manifest.ts', () => {
  it('isShardingData', () => {
    expect(Manifest.isShardingData([])).toBeFalsy();
    expect(Manifest.isShardingData([1])).toBeFalsy();
    expect(Manifest.isShardingData([1, '2'])).toBeFalsy();
    expect(Manifest.isShardingData([1, 'https://'])).toBeFalsy();
    expect(Manifest.isShardingData([1, '2', 'https://'])).toBeFalsy();
    expect(Manifest.isShardingData(['http://'])).toBeTruthy();
    expect(Manifest.isShardingData(['https://'])).toBeTruthy();
    expect(Manifest.isShardingData(['/Users/a/b.json'])).toBeTruthy();
    expect(Manifest.isShardingData(['http://', 'https://'])).toBeTruthy();
    expect(
      Manifest.isShardingData(['/Users/a/b.json', 'https://']),
    ).toBeTruthy();
  });

  it('fetchShardingData', async () => {
    expect(await Manifest.fetchShardingData([], async (v) => v)).toStrictEqual(
      [],
    );

    expect(
      await Manifest.fetchShardingData(
        [Algorithm.compressText(JSON.stringify({ a: 1, b: '2' }))],
        async (v) => v,
      ),
    ).toStrictEqual({ a: 1, b: '2' });

    const v = Algorithm.compressText(
      JSON.stringify({
        a: 1,
        b: '2',
        c: [3, 4],
        d: true,
      }),
    );
    expect(
      await Manifest.fetchShardingData(
        [v.slice(0, 5), v.slice(5, 12), v.slice(12)],
        async (v) => v,
      ),
    ).toStrictEqual({ a: 1, b: '2', c: [3, 4], d: true });
  });
});
