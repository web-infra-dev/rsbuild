import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should respect tsconfig paths and override resolve.alias', async ({
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

test('should ignore tsconfig paths when aliasStrategy is "prefer-alias"', async ({
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
