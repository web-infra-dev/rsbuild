import { join, resolve } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = resolve(__dirname, '../');

test.setTimeout(120000);

test('resolve-extension-prefix', async ({ page }) => {
  const buildOpts = {
    cwd: fixtures,
    runServer: true,
  };

  // ex.js take effect when not set resolveExtensionPrefix
  let rsbuild = await build(buildOpts);
  await page.goto(getHrefByEntryName('index', rsbuild.port));
  await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');

  await rsbuild.close();

  // ex.web.js take effect when set resolveExtensionPrefix
  rsbuild = await build({
    ...buildOpts,
    rsbuildConfig: {
      source: {
        resolveExtensionPrefix: '.web',
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));
  await expect(page.innerHTML('#test-el')).resolves.toBe('web');

  await rsbuild.close();
});
