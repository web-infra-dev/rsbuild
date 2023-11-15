import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

// TODO run with uni-builder
test.skip('module-scopes', async ({ page }) => {
  const buildOpts = {
    cwd: join(fixtures, 'module-scopes'),
  };

  await expect(
    build<'webpack'>({
      ...buildOpts,
      rsbuildConfig: {
        source: {
          entries: {
            index: join(fixtures, 'module-scopes/src/index.js'),
          },
          //   moduleScopes: ['./src'],
        },
      },
    }),
  ).rejects.toThrowError('Webpack build failed!');

  let rsbuild = await build({
    ...buildOpts,
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild! 1');

  await rsbuild.close();

  // should not throw
  rsbuild = await build<'webpack'>({
    ...buildOpts,
    rsbuildConfig: {
      source: {
        // moduleScopes: ['./src', './common'],
      },
    },
  });

  await rsbuild.close();
});
