import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should return the asset URL with `?url`', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  await expect(
    page.evaluate(
      `document.getElementById('test-img').src.includes('static/image/icon')`,
    ),
  ).resolves.toBeTruthy();

  await rsbuild.close();
});
