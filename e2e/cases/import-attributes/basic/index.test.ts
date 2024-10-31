import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should support import attributes syntax', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const indexJs = await rsbuild.getIndexFile();
  expect(indexJs.content).toContain('with import attributes');
});
