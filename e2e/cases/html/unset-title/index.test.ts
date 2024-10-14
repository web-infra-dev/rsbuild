import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to unset the title tag', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();

  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(html).not.toContain('<title>');
});
