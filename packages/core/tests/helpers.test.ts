import { ensureAssetPrefix, pick } from '../src/helpers';
import { normalizeUrl } from '../src/server/helper';

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
