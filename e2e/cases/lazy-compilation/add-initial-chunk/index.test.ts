import { dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

// https://github.com/web-infra-dev/rspack/issues/6633
rspackOnlyTest(
  'should render pages correctly when using lazy compilation and add new initial chunk',
  async ({ page }) => {
    if (process.platform === 'win32') {
      test.skip();
    }

    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    await expect(page.locator('#test')).toHaveText('Hello World!');
    await rsbuild.close();
  },
);
