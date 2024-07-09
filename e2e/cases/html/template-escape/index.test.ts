import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should escape template parameters correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();

  const fooHtml =
    files[Object.keys(files).find((file) => file.endsWith('foo.html'))!];
  expect(fooHtml).toContain('&lt;div&gt;escape me&lt;/div&gt;');

  const indexHtml =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(indexHtml).toContain('<div>escape me</div>');
});
