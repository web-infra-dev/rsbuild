import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow to use the `using` declaration for explicit resource management',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    expect(await page.evaluate('window.disposeCounter')).toEqual(4);
    await rsbuild.close();
  },
);
