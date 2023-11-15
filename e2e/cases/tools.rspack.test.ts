import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '../scripts/shared';

const fixtures = __dirname;

test('tools.rspack', async ({ page }) => {
  const rsbuild = await build<'rspack'>({
    cwd: join(fixtures, 'source/global-vars'),
    runServer: true,
    rsbuildConfig: {
      source: {
        entry: {
          index: join(fixtures, 'source/global-vars/src/index.ts'),
        },
      },
      tools: {
        rspack: (config, { rspack }) => {
          config.plugins?.push(
            new rspack.DefinePlugin({
              ENABLE_TEST: JSON.stringify(true),
            }),
          );
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  await rsbuild.close();
});
