import { join } from 'node:path';
import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

const fixture = join(__dirname, 'app');

rspackOnlyTest(
  'should build succeed with source build plugin',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: fixture,
      runServer: true,
    });

    await gotoPage(page, rsbuild);

    const locator = page.locator('#root');
    await expect(locator).toHaveText(
      'Card Comp Title: appCARD COMP CONTENT:hello world',
    );

    await rsbuild.close();
  },
);
