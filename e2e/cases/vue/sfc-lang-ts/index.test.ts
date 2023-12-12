import { expect } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { rspackOnlyTest } from '@scripts/helper';

rspackOnlyTest(
  'should build Vue sfc with lang="ts" correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      runServer: true,
    });

    await page.goto(getHrefByEntryName('index', rsbuild.port));

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0 foo: bar');

    await rsbuild.close();
  },
);
