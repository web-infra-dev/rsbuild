import { expect, test } from '@e2e/helper';

test('should support using transformImport to reduce lodash bundle size', async ({
  build,
}) => {
  const rsbuild = await build();

  const content = await rsbuild.getIndexBundle();
  const size = content.length / 1024;

  expect(content.includes('debounce')).toBeFalsy();
  expect(size < 10).toBeTruthy();
});
