import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should allow to custom CSS minify options', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {},
  });
  const files = await rsbuild.getDistFiles();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toEqual('.bar{color:green}');
});
