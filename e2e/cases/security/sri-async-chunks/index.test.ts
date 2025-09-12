import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'generate integrity for async script tags in build',
  async ({ page, build }) => {
    const rsbuild = await build();

    const content = await rsbuild.getIndexBundle();

    expect(
      content.includes('sriHashes={') && content.includes('"sha384-'),
    ).toBe(true);

    const testEl = page.locator('#root');
    await expect(testEl).toHaveText('foo');
  },
);
