import { determineAsValue } from '../src/rspack/preload/helpers';

describe('determineAsValue test', () => {
  it('should return as attribute', () => {
    expect(
      determineAsValue({
        href: '"/chunk/vendors.js"',
        file: 'chunk/vendors.js',
      }),
    ).toBe('script');
  });

  it('should return as attribute', () => {
    expect(
      determineAsValue({
        href: '/image/logo.png',
        file: 'image/logo.png',
      }),
    ).toBe('image');
  });
});
