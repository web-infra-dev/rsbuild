import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow to use the `using` declaration for explicit resource management in development',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    expect(await page.evaluate('window.disposeCounter')).toEqual(4);
    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should allow to use the `using` declaration for explicit resource management in production',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    expect(await page.evaluate('window.disposeCounter')).toEqual(4);
    await rsbuild.close();
  },
);
