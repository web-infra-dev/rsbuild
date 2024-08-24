import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should build basic Vue jsx correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  const button1 = page.locator('#button1');
  await expect(button1).toHaveText('A: 0');

  await rsbuild.close();
});
