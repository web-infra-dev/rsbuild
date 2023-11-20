import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

test.skip('global-vars', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'global-vars'),
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          index: join(fixtures, 'global-vars/src/index.ts'),
        },
        // globalVars: {
        //   ENABLE_TEST: true,
        // },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  await rsbuild.close();
});
