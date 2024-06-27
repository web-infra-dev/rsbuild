import { sep } from 'node:path';
import { ensureAssetPrefix, pick, prettyTime } from '../src/helpers';
import { getCommonParentPath } from '../src/helpers/path';
import { normalizeUrl } from '../src/server/helper';

test('should pretty time correctly', () => {
  expect(prettyTime(0.0012)).toEqual('0.001 s');
  expect(prettyTime(0.0123)).toEqual('0.01 s');
  expect(prettyTime(0.1234)).toEqual('0.12 s');
  expect(prettyTime(1.234)).toEqual('1.23 s');
  expect(prettyTime(12.34)).toEqual('12.3 s');
  expect(prettyTime(123.4)).toEqual('2.06 m');
  expect(prettyTime(1234)).toEqual('20.57 m');
});

describe('pick', () => {
  it('should pick from object correctly', () => {
    expect(pick({ foo: 1, bar: 2 }, ['foo'])).toEqual({ foo: 1 });
  });

  it('should not pick undefined properties', () => {
    expect(pick({ foo: undefined, bar: undefined }, ['foo'])).toEqual({});
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
