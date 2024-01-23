import { expect, test } from '@playwright/test';
import { build, gotoPage } from '../../../scripts/shared';

test('tsconfig paths should work and override the alias config', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      source: {
        alias: {
          '@common': './src/common2',
        },
      },
    },
  });

  await gotoPage(page, rsbuild);

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('tsconfig paths worked');

  await rsbuild.close();
});

test('tsconfig paths should not work when aliasStrategy is "prefer-alias"', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
    rsbuildConfig: {
      source: {
        alias: {
          '@/common': './src/common2',
        },
        aliasStrategy: 'prefer-alias',
      },
    },
  });

  await gotoPage(page, rsbuild);

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('source.alias worked');

  await rsbuild.close();
});
