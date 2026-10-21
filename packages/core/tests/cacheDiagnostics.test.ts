import { enableCacheInfoStats } from '../src/plugins/cacheDiagnostics';

it('enables reuse tracking without changing the selected stats preset', () => {
  expect(enableCacheInfoStats(false)).toEqual({
    preset: 'none',
    cacheInfo: true,
  });
  expect(enableCacheInfoStats('errors-only')).toEqual({
    preset: 'errors-only',
    cacheInfo: true,
  });
  expect(enableCacheInfoStats({ warnings: false })).toEqual({
    warnings: false,
    cacheInfo: true,
  });
});
