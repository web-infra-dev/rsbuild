import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should build Vue SFC with lang="postcss" correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const button = page.locator('#button');
    await expect(button).toHaveCSS('color', 'rgb(255, 0, 0)');

    await rsbuild.close();
  },
);
