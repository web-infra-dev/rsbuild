import { expect } from '@playwright/test';
import { build, gotoPage } from '@scripts/shared';
import { rspackOnlyTest } from '@scripts/helper';

rspackOnlyTest(
  'should build Vue sfc with lang="ts" correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
    });

    await gotoPage(page, rsbuild);

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0 foo: bar');

    await rsbuild.close();
  },
);
