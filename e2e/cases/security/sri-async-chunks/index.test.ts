import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'generate integrity for async script tags in build',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const content = await rsbuild.getIndexBundle();

    expect(
      content.includes('sriHashes={') && content.includes('"sha384-'),
    ).toBe(true);

    const testEl = page.locator('#root');
    await expect(testEl).toHaveText('foo');
    await rsbuild.close();
  },
);
