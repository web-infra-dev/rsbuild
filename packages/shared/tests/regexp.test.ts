import { JS_REGEX, TS_REGEX, mergeRegex } from '../src';

describe('mergeRegex', () => {
  it('should merge two regexp correctly', () => {
    expect(mergeRegex(TS_REGEX, JS_REGEX)).toEqual(
      /\.(ts|mts|cts|tsx)$|\.(js|mjs|cjs|jsx)$/,
    );
  });

  it('should merge regexp and string correctly', () => {
    expect(mergeRegex(TS_REGEX, 'foo')).toEqual(/\.(ts|mts|cts|tsx)$|foo/);
  });
});
