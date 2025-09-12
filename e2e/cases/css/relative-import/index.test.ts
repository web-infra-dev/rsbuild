import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should compile CSS relative imports correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = rsbuild.getDistFiles();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toContain('.foo{color:red}.bar{color:#00f}.baz{color:green}');
});
