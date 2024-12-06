import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('tsconfig paths should work and override the alias config', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      resolve: {
        alias: {
          '@common': './src/common2',
        },
      },
    },
  });

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('tsconfig paths worked');

  await rsbuild.close();
});

test('tsconfig paths should not work when aliasStrategy is "prefer-alias"', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    rsbuildConfig: {
      resolve: {
        alias: {
          '@/common': './src/common2',
        },
        aliasStrategy: 'prefer-alias',
      },
    },
  });

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('resolve.alias worked');

  await rsbuild.close();
});
