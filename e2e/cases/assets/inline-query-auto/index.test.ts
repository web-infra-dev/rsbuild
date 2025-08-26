import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

test('should inline small assets automatically', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    plugins: [pluginReact()],
  });

  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.startsWith('data:image/png')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
