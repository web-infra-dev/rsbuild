import { join } from 'path';
import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';

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
    await gotoPage(page, rsbuild);
    await expect(page.innerHTML('#test')).resolves.toBe('Hello Rsbuild! 1');
  });

  test('pre-entry', async ({ page }) => {
    await gotoPage(page, rsbuild);
    await expect(page.innerHTML('#test-el')).resolves.toBe('aaaaa');

    // test order
    await expect(page.evaluate('window.aa')).resolves.toBe(2);
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

  await gotoPage(page, rsbuild);

  const testEl = page.locator('#test-el');
  await expect(testEl).toHaveText('aaaaa');

  await rsbuild.close();
});
