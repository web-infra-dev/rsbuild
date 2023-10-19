import { join, resolve } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = resolve(__dirname, '../');

test.setTimeout(120000);

test('resolve-extension-prefix', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.js'),
    },
    runServer: true,
  };

  // ex.js take effect when not set resolveExtensionPrefix
  let rsbuild = await build(buildOpts);
  await page.goto(getHrefByEntryName('main', rsbuild.port));
  await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');

  rsbuild.close();

  // ex.web.js take effect when set resolveExtensionPrefix
  rsbuild = await build({
    ...buildOpts,
    builderConfig: {
      source: {
        resolveExtensionPrefix: '.web',
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));
  await expect(page.innerHTML('#test-el')).resolves.toBe('web');

  rsbuild.close();
});
