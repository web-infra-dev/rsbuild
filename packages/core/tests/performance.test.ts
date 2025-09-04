import { sep } from 'node:path';
import { getCommonParentPath } from '../src/helpers/path';

describe('getCommonParentPath performance', () => {
  it('should handle large arrays efficiently', () => {
    // Create a test case with many similar paths
    const paths = Array.from(
      { length: 100 },
      (_, i) =>
        `/very/long/path/to/some/deeply/nested/directory/structure/file${i}`,
    );

    const startTime = performance.now();
    const result = getCommonParentPath(paths);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should return the common parent path
    expect(result).toBe(
      '/very/long/path/to/some/deeply/nested/directory/structure',
    );

    // Should complete in reasonable time (< 100ms for 100 paths)
    // This is a regression test to ensure performance optimizations are maintained
    expect(duration).toBeLessThan(100);
  });

  it('should efficiently deduplicate paths', () => {
    // Test case with many duplicate paths
    const basePaths = [
      '/home/user/project/dist',
      '/home/user/project/dist/sub1',
      '/home/user/project/dist/sub2',
    ];

    // Create array with many duplicates
    const paths = [];
    for (let i = 0; i < 50; i++) {
      paths.push(...basePaths);
    }

    const startTime = performance.now();
    const result = getCommonParentPath(paths);
    const endTime = performance.now();
    const duration = endTime - startTime;

    const normalize = (p: string) => p.replaceAll('/', sep);
    expect(result).toBe(normalize('/home/user/project/dist'));

    // Should handle duplicates efficiently
    expect(duration).toBeLessThan(50);
  });
});
