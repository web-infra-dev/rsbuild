import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// see: https://github.com/rspack-contrib/html-rspack-plugin/issues/14
test('should compile template with es template correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = rsbuild.getDistFiles();

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  // biome-ignore lint/suspicious/noTemplateCurlyInString: should ignore string
  expect(indexHtml).toContain("const baseUrl = match ? `${match[0]}/` : '/'");
});
