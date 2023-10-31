import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

test('module-scopes', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'module-scopes'),
    entry: {
      main: join(fixtures, 'module-scopes/src/index.js'),
    },
  };

  await expect(
    build({
      ...buildOpts,
      rsbuildConfig: {
        source: {
          moduleScopes: ['./src'],
        },
      },
    }),
  ).rejects.toThrowError('Webpack build failed!');

  let rsbuild = await build({
    ...buildOpts,
    runServer: true,
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild! 1');

  rsbuild.close();

  // should not throw
  rsbuild = await build({
    ...buildOpts,
    rsbuildConfig: {
      source: {
        moduleScopes: ['./src', './common'],
      },
    },
  });

  rsbuild.close();
});
