import { dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// https://github.com/web-infra-dev/rspack/issues/6633
rspackOnlyTest(
  'should render pages correctly when using lazy compilation',
  async ({ page }) => {
    // TODO fix this case in Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    const rsbuild = await dev({
      cwd: __dirname,
    });

    await gotoPage(page, rsbuild);
    await expect(page.locator('#test')).toHaveText('Hello World!');

    rsbuild.close();
  },
);
