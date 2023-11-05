import { describe, it, expect } from 'vitest';
import { extractLoaderName, getLoaderOptions } from '@/build-utils/build/utils';

describe('test src/build/utils/loader.ts basic functions', () => {
  it('extractLoaderName()', () => {
    expect(extractLoaderName('cache-loader')).toEqual('cache-loader');
    expect(
      extractLoaderName('/Users/node_modules/cache-loader/lib/index.js'),
    ).toEqual('cache-loader');
    expect(
      extractLoaderName('/Users/node_modules/cache-loader/lib/loader.js'),
    ).toEqual('cache-loader/lib/loader');
  });

  it('getLoaderOptions()', () => {
    // webpack5
    // @ts-expect-error
    expect(getLoaderOptions({ getOptions: () => ({ a: 1 }) })).toStrictEqual({
      a: 1,
    });

    // webpack4
    // @ts-expect-error
    expect(getLoaderOptions({ query: { a: 1 } })).toStrictEqual({ a: 1 });
  });
});
