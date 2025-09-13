import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow to use the `using` declaration for explicit resource management in development',
  async ({ page, dev }) => {
    await dev();

    expect(await page.evaluate('window.disposeCounter')).toEqual(4);
  },
);

rspackTest(
  'should allow to use the `using` declaration for explicit resource management in production',
  async ({ page, buildPreview }) => {
    await buildPreview();

    expect(await page.evaluate('window.disposeCounter')).toEqual(4);
  },
);
