import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

test.describe('source configure multi', () => {
  let rsbuild: Awaited<ReturnType<typeof build>>;

  test.beforeAll(async () => {
    rsbuild = await build({
      cwd: join(fixtures, 'basic'),
      runServer: true,
      rsbuildConfig: {
        source: {
          entry: {
            index: join(fixtures, 'basic/src/index.js'),
          },
          alias: {
            '@common': './src/common',
          },
          preEntry: ['./src/pre.js'],
        },
      },
    });
  });

  test.afterAll(async () => {
    await rsbuild.close();
  });

  test('alias', async ({ page }) => {
    await page.goto(getHrefByEntryName('index', rsbuild.port));
    await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild! 1');
  });

  test('pre-entry', async ({ page }) => {
    await page.goto(getHrefByEntryName('index', rsbuild.port));
    await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');

    // test order
    await expect(page.evaluate(`window.aa`)).resolves.toBe(2);
  });
});

test('define', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'global-vars'),
    runServer: true,
    rsbuildConfig: {
      source: {
        define: {
          ENABLE_TEST: JSON.stringify(true),
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  await rsbuild.close();
});

test('tsconfig paths should work and override the alias config', async ({
  page,
}) => {
  const cwd = join(fixtures, 'tsconfig-paths');
  const rsbuild = await build({
    cwd,
    runServer: true,
    rsbuildConfig: {
      source: {
        alias: {
          '@common': './src/common2',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('tsconfig paths worked');

  await rsbuild.close();
});

test('tsconfig paths should not work when aliasStrategy is "prefer-alias"', async ({
  page,
}) => {
  const cwd = join(fixtures, 'tsconfig-paths');
  const rsbuild = await build({
    cwd,
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

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('source.alias worked');

  await rsbuild.close();
});
