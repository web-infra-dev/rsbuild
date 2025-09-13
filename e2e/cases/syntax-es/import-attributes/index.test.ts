import { expect, rspackTest } from '@e2e/helper';

rspackTest('should support import attributes syntax', async ({ build }) => {
  const rsbuild = await build();
  const indexJs = await rsbuild.getIndexBundle();
  expect(indexJs).toContain('with import attributes');
});
