import { getResourceType } from '../src/rspack/preload/helpers';

describe('getResourceType test', () => {
  it('should return as attribute', () => {
    expect(
      getResourceType({
        href: '"/chunk/vendors.js"',
        file: 'chunk/vendors.js',
      }),
    ).toBe('script');
  });

  it('should return as attribute', () => {
    expect(
      getResourceType({
        href: '/image/logo.png',
        file: 'image/logo.png',
      }),
    ).toBe('image');
  });
});
