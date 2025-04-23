import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// see: https://github.com/rspack-contrib/html-rspack-plugin/issues/14
test('should compile template with es template correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.getDistFiles();

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(indexHtml).toContain("const baseUrl = match ? `${match[0]}/` : '/'");
});
