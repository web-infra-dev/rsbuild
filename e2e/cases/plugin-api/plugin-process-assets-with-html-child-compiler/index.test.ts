import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should allow plugin to process assets', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.getDistFiles();
  const indexJs = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.js'),
  );
  const indexCss = Object.keys(files).find(
    (file) => file.includes('index') && file.endsWith('.css'),
  );

  expect(indexJs).toBeTruthy();
  expect(indexCss).toBeFalsy();
});
