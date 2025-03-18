import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'generate integrity for script and style tags in dev build',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    const testEl = page.locator('#root');
    await expect(testEl).toHaveText('Hello Rsbuild!');

    expect(
      await page.evaluate(
        'document.querySelector("script")?.getAttribute("integrity")',
      ),
    ).toMatch(/sha384-[A-Za-z0-9+\/=]+/);

    await rsbuild.close();
  },
);
