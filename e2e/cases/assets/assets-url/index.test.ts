import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

test('should allow to get assets URL with `?url`', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    plugins: [pluginReact()],
  });

  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.includes('static/image/icon')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
