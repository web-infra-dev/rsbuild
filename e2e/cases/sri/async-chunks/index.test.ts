import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

// TODO: fix this test
rspackOnlyTest(
  'generate integrity for async script tags in prod build',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const { content } = await rsbuild.getIndexFile();

    expect(
      content.includes('sriHashes={') && content.includes('"sha384-'),
    ).toBe(true);

    const testEl = page.locator('#root');
    await expect(testEl).toHaveText('foo');
    await rsbuild.close();
  },
);
