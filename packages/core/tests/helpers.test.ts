import { join, sep } from 'node:path';
import {
  ensureAssetPrefix,
  isPlainObject,
  isWebTarget,
  pick,
  prettyTime,
} from '../src/helpers';
import { dedupeNestedPaths, getCommonParentPath } from '../src/helpers/path';
import { getRoutes, normalizeUrl } from '../src/server/helper';
import type { InternalContext } from '../src/types';

test('should getRoutes correctly', () => {
  const cwd = __dirname;
  expect(
    getRoutes({
      distPath: join(cwd, 'dist'),
      normalizedConfig: {
        server: {
          base: '/',
        },
      },
      environments: {
        web: {
          distPath: join(cwd, 'dist'),
          htmlPaths: {
            index: 'index.html',
          },
          config: {
            output: {
              distPath: {
                html: '/',
              },
            },
            html: {
              outputStructure: 'flat',
            },
          },
        },
        web1: {
          distPath: join(cwd, 'dist/web1'),
          htmlPaths: {
            index: 'index.html',
          },
          config: {
            output: {
              distPath: {
                html: '/',
              },
            },
            html: {
              outputStructure: 'flat',
            },
          },
        },
        web2: {
          distPath: join(cwd, 'dist/web2'),
          htmlPaths: {
            index: 'index.html',
            main: 'main.html',
          },
          config: {
            output: {
              distPath: {
                html: '/',
              },
            },
            html: {
              outputStructure: 'nested',
            },
          },
        },
      },
    } as unknown as InternalContext),
  ).toEqual([
    {
      entryName: 'index',
      pathname: '/',
    },
    {
      entryName: 'index',
      pathname: '/web1/',
    },
    {
      entryName: 'index',
      pathname: '/web2/index',
    },
    {
      entryName: 'main',
      pathname: '/web2/main',
    },
  ]);
});

test('should pretty time correctly', () => {
  expect(prettyTime(0.0012)).toEqual('0.001 s');
  expect(prettyTime(0.0123)).toEqual('0.01 s');
  expect(prettyTime(0.1234)).toEqual('0.12 s');
  expect(prettyTime(1.234)).toEqual('1.23 s');
  expect(prettyTime(12.34)).toEqual('12.3 s');
  expect(prettyTime(120)).toEqual('2 m');
  expect(prettyTime(123.4)).toEqual('2 m 3.4 s');
  expect(prettyTime(1234)).toEqual('20 m 34 s');
  expect(prettyTime(1234.5)).toEqual('20 m 34.5 s');
});

describe('pick', () => {
  it('should pick from object correctly', () => {
    expect(pick({ foo: 1, bar: 2 }, ['foo'])).toEqual({ foo: 1 });
  });

  it('should not pick undefined properties', () => {
    expect(pick({ foo: undefined, bar: undefined }, ['foo'])).toEqual({});
  });

  it('should pick multiple properties', () => {
    expect(pick({ foo: 1, bar: 2, baz: 3 }, ['foo', 'bar'])).toEqual({
      foo: 1,
      bar: 2,
    });
  });

  it('should handle empty keys array', () => {
    expect(pick({ foo: 1, bar: 2 }, [])).toEqual({});
  });

  it('should handle non-existent keys', () => {
    expect(pick({ foo: 1 }, ['bar' as any])).toEqual({});
  });

  it('should pick falsy values correctly', () => {
    expect(
      pick({ foo: 0, bar: false, baz: null, qux: '' }, [
        'foo',
        'bar',
        'baz',
        'qux',
      ]),
    ).toEqual({
      foo: 0,
      bar: false,
      baz: null,
      qux: '',
    });
  });
});

it('normalizeUrl', () => {
  expect(normalizeUrl('https://www.example.com/static//a')).toBe(
    'https://www.example.com/static/a',
  );

  expect(normalizeUrl('https://www.example.com/static/a')).toBe(
    'https://www.example.com/static/a',
  );

  expect(normalizeUrl('https://www.example.com/static/')).toBe(
    'https://www.example.com/static/',
  );
});

describe('ensureAssetPrefix', () => {
  const ASSET_PREFIX = 'https://www.example.com/static/';
  const CAPITAL_ASSET_PREFIX = 'https://www.{{CDN}}.com/{{CDN_PATH}}/';

  it('should handle relative url', () => {
    expect(ensureAssetPrefix('foo/bar.js', ASSET_PREFIX)).toBe(
      'https://www.example.com/static/foo/bar.js',
    );
    expect(ensureAssetPrefix('foo/bar.js', '')).toBe('foo/bar.js');
    expect(ensureAssetPrefix('foo/bar.js', '/')).toBe('/foo/bar.js');
    expect(ensureAssetPrefix('/foo/bar.js', ASSET_PREFIX)).toBe(
      'https://www.example.com/static/foo/bar.js',
    );
    expect(ensureAssetPrefix('/foo/bar.js', '/')).toBe('/foo/bar.js');
  });

  it('should handle absolute url', () => {
    expect(ensureAssetPrefix('/foo/bar.js', ASSET_PREFIX)).toBe(
      'https://www.example.com/static/foo/bar.js',
    );
    expect(ensureAssetPrefix('/foo/bar.js', '/')).toBe('/foo/bar.js');
  });

  it('should handle absolute url with hostname & protocol', () => {
    expect(ensureAssetPrefix('http://foo.com/bar.js', ASSET_PREFIX)).toBe(
      'http://foo.com/bar.js',
    );
    expect(ensureAssetPrefix('http://foo.com/bar.js', '/')).toBe(
      'http://foo.com/bar.js',
    );
  });

  it('should handle absolute url with double slash', () => {
    expect(ensureAssetPrefix('//foo.com/bar.js', ASSET_PREFIX)).toBe(
      '//foo.com/bar.js',
    );
    expect(ensureAssetPrefix('//foo.com/bar.js', '/')).toBe('//foo.com/bar.js');
    expect(ensureAssetPrefix('/bar.js', '//foo.com')).toBe('//foo.com/bar.js');
  });

  it('should keep the original URL', () => {
    expect(ensureAssetPrefix('foo/bar.js', CAPITAL_ASSET_PREFIX)).toBe(
      'https://www.{{CDN}}.com/{{CDN_PATH}}/foo/bar.js',
    );
    expect(ensureAssetPrefix('/foo/bar.js', CAPITAL_ASSET_PREFIX)).toBe(
      'https://www.{{CDN}}.com/{{CDN_PATH}}/foo/bar.js',
    );
  });
});

describe('getCommonParentPath', () => {
  const normalize = (p: string) => p.replaceAll('/', sep);

  it('should return the common parent path for given paths', () => {
    const paths = [
      normalize('/home/user/project/dist'),
      normalize('/home/user/project/dist/sub1'),
      normalize('/home/user/project/dist/sub2'),
    ];
    const result = getCommonParentPath(paths);
    expect(result).toBe(normalize('/home/user/project/dist'));

    const paths2 = [
      normalize('/home/user/project/dist1'),
      normalize('/home/user/project/dist2'),
    ];
    const result2 = getCommonParentPath(paths2);
    expect(result2).toBe(normalize('/home/user/project'));
  });

  it('should return empty string if there is no common parent path', () => {
    const paths = [
      normalize('/home/user/project/dist'),
      normalize('/home2/user/project/dist'),
    ];
    const result = getCommonParentPath(paths);
    expect(result).toBe('');
  });

  it('should handle single path input', () => {
    const paths = [normalize('/home/user/project/dist1')];
    const result = getCommonParentPath(paths);
    expect(result).toBe(normalize('/home/user/project/dist1'));
  });
});

test('should dedupeNestedPaths correctly', async () => {
  expect(
    dedupeNestedPaths([
      'package/to/root/dist/web1',
      'package/to/root/dist/web2',
      'package/to/root/dist',
    ]),
  ).toEqual(['package/to/root/dist']);

  expect(
    dedupeNestedPaths([
      'package/to/root',
      'package/to/root/dist/web2',
      'package/to/root/dist',
    ]),
  ).toEqual(['package/to/root']);

  expect(
    dedupeNestedPaths([
      'package/to/root/dist/web1',
      'package/to/root/dist/web2',
      'package/to/root/dist/web3',
      'package/to/root/dist/web3',
    ]),
  ).toEqual([
    'package/to/root/dist/web1',
    'package/to/root/dist/web2',
    'package/to/root/dist/web3',
  ]);
});

test('should isWebTarget work correctly', () => {
  // Test with single targets
  expect(isWebTarget('web')).toBe(true);
  expect(isWebTarget('node')).toBe(false);

  // Test with arrays
  expect(isWebTarget(['web'])).toBe(true);
  expect(isWebTarget(['node'])).toBe(false);
  expect(isWebTarget(['web', 'node'])).toBe(true);
  expect(isWebTarget(['node'])).toBe(false);

  // Test web-worker target
  expect(isWebTarget('web-worker')).toBe(true);
  expect(isWebTarget(['web-worker'])).toBe(true);
  expect(isWebTarget(['web-worker', 'node'])).toBe(true);

  // @ts-expect-error
  expect(isWebTarget('web-worker-special')).toBe(false);
  // @ts-expect-error
  expect(isWebTarget('something-web-worker-else')).toBe(false);
});

describe('isPlainObject', () => {
  it('should return true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ foo: 'bar' })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(false);
  });

  it('should return false for non-plain objects', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject('string')).toBe(false);
    expect(isPlainObject(123)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(/regex/)).toBe(false);

    class TestClass {}
    expect(isPlainObject(new TestClass())).toBe(false);
  });
});
