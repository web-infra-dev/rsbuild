import { describe, it, expect } from 'vitest';
import { Bundle } from '../../src/common';

describe('test src/common/bundle.ts', () => {
  it('getBundleDiffPageQueryString', () => {
    const files = ['a', 'b'];
    expect(Bundle.getBundleDiffPageQueryString(files)).toEqual(
      '?__bundle_files__=a%2Cb',
    ); // TODO: test error fix
  });

  it('getBundleDiffPageUrl', () => {
    const files = ['a', 'b'];
    expect(Bundle.getBundleDiffPageUrl(files)).toEqual(
      '?__bundle_files__=a%2Cb#/resources/bundle/diff',
    );
  });

  it('parseFilesFromBundlePageUrlQuery', () => {
    expect(Bundle.parseFilesFromBundlePageUrlQuery('a%2Cb')).toStrictEqual([
      'a',
      'b',
    ]);
  });
});
