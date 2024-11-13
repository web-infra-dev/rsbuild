import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should build Vue SFC with lang="ts" correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const button = page.locator('#button');
    await expect(button).toHaveText('count: 0 foo: bar');

    await rsbuild.close();
  },
);
