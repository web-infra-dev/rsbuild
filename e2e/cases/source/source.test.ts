import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '@scripts/shared';

const fixtures = __dirname;

test.describe('source configure multi', () => {
  let rsbuild: Awaited<ReturnType<typeof build>>;

  test.beforeAll(async () => {
    rsbuild = await build({
      cwd: join(fixtures, 'basic'),
      entry: {
        main: join(fixtures, 'basic/src/index.js'),
      },
      runServer: true,
      rsbuildConfig: {
        source: {
          alias: {
            '@common': './src/common',
          },
          preEntry: ['./src/pre.js'],
        },
      },
    });
  });

  test.afterAll(() => {
    rsbuild.close();
  });

  test('alias', async ({ page }) => {
    await page.goto(getHrefByEntryName('main', rsbuild.port));
    await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild! 1');
  });

  test('pre-entry', async ({ page }) => {
    await page.goto(getHrefByEntryName('main', rsbuild.port));
    await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');

    // test order
    await expect(page.evaluate(`window.aa`)).resolves.toBe(2);
  });
});

// TODO: move to uni-builder
test.skip('global-vars', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'global-vars'),
    entry: {
      main: join(fixtures, 'global-vars/src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      source: {
        // globalVars: {
        //   ENABLE_TEST: true,
        // },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  rsbuild.close();
});

test('define', async ({ page }) => {
  const rsbuild = await build({
    cwd: join(fixtures, 'global-vars'),
    entry: {
      main: join(fixtures, 'global-vars/src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      source: {
        define: {
          ENABLE_TEST: JSON.stringify(true),
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  rsbuild.close();
});

test('tsconfig paths should work and override the alias config', async ({
  page,
}) => {
  const cwd = join(fixtures, 'tsconfig-paths');
  const rsbuild = await build({
    cwd,
    entry: {
      main: join(cwd, 'src/index.ts'),
    },
    runServer: true,
    rsbuildConfig: {
      source: {
        alias: {
          '@common': './src/common2',
        },
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('tsconfig paths worked');

  rsbuild.close();
});

test('tsconfig paths should not work when aliasStrategy is "prefer-alias"', async ({
  page,
}) => {
  const cwd = join(fixtures, 'tsconfig-paths');
  const rsbuild = await build({
    cwd,
    entry: {
      main: join(cwd, 'src/index.ts'),
    },
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

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('source.alias worked');

  rsbuild.close();
});
