import { build, expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to use the `using` declaration for explicit resource management in development',
  async ({ page, dev }) => {
    await dev();

    expect(await page.evaluate('window.disposeCounter')).toEqual(4);
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
