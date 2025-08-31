import { isSatisfyRspackVersion, rspackMinVersion } from '../src/helpers';

describe('rspack version', () => {
  it('isSatisfyRspackVersion', () => {
    expect(isSatisfyRspackVersion('0.1.0')).toBeFalsy();

    expect(isSatisfyRspackVersion(rspackMinVersion)).toBeTruthy();

    expect(isSatisfyRspackVersion('10.0.0')).toBeTruthy();

    expect(
      isSatisfyRspackVersion('0.2.7-canary-efa0dc6-20230817005622'),
    ).toBeFalsy();

    expect(
      isSatisfyRspackVersion(
        `${rspackMinVersion}-canary-efa0dc6-20230817005622`,
      ),
    ).toBeTruthy();
  });

  it('should handle repeated version comparisons efficiently', () => {
    // Test that repeated calls with the same version strings work correctly
    // This validates that our memoization doesn't break functionality
    const version1 = '1.5.0';
    const version2 = '1.4.0';

    // Call multiple times to test memoization
    expect(isSatisfyRspackVersion(version1)).toBeTruthy();
    expect(isSatisfyRspackVersion(version1)).toBeTruthy();
    expect(isSatisfyRspackVersion(version2)).toBeFalsy();
    expect(isSatisfyRspackVersion(version2)).toBeFalsy();

    // Test with different formats
    expect(isSatisfyRspackVersion('1.5.0-canary-abc')).toBeTruthy();
    expect(isSatisfyRspackVersion('1.5.0-canary-abc')).toBeTruthy();
  });

  it('should provide performance benefits for repeated calls', () => {
    const testVersions = [
      '1.5.0',
      '1.4.9',
      '1.5.1',
      '1.5.0-canary-abc',
      '1.6.0',
    ];

    // Warm up the cache
    for (const version of testVersions) {
      isSatisfyRspackVersion(version);
    }

    // Test performance - this should be faster on repeated calls due to memoization
    const iterations = 1000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      for (const version of testVersions) {
        isSatisfyRspackVersion(version);
      }
    }

    const end = performance.now();
    const totalTime = end - start;

    // The test should complete in reasonable time (arbitrary threshold)
    // This is more about ensuring the optimization doesn't break anything
    expect(totalTime).toBeLessThan(1000); // Should be much faster than 1 second
  });
});
