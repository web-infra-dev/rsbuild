import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to use the `using` declaration for explicit resource management in development',
  async ({ page, dev }) => {
    await dev();

    expect(await page.evaluate('window.disposeCounter')).toEqual(4);
  },
);

rspackOnlyTest(
  'should allow to use the `using` declaration for explicit resource management in production',
  async ({ page, build }) => {
    const rsbuild = await build();

    expect(await page.evaluate('window.disposeCounter')).toEqual(4);
  },
);
