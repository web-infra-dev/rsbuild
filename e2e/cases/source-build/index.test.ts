import { join } from 'path';
import { expect } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';
import { rspackOnlyTest } from '@scripts/helper';

const fixture = join(__dirname, 'app');

rspackOnlyTest(
  'should build succeed with source build plugin',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: fixture,
      runServer: true,
    });

    await page.goto(getHrefByEntryName('index', rsbuild.port));

    const locator = page.locator('#root');
    await expect(locator).toHaveText(
      'Card Comp Title: AppCARD COMP CONTENT:hello world',
    );

    await rsbuild.close();
  },
);
