import { dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('should serve multiple environments correctly', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      environments: {
        web: {},
        web1: {
          dev: {
            // When generating multiple environment web products, file search conflicts will occur if assetPrefix is ​​not added.
            assetPrefix: 'auto',
          },
          source: {
            entry: {
              main: './src/web1.js',
            },
          },
          output: {
            distPath: {
              root: 'dist/web1',
              html: 'html1',
            },
          },
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await page.goto(`http://localhost:${rsbuild.port}/web1/html1/main`);

  const locator1 = page.locator('#test');
  await expect(locator1).toHaveText('Hello Rsbuild (web1)!');

  await rsbuild.close();
});

// TODO: not support serve multiple environments when distPath different
test.skip('serve multiple environments correctly when distPath different', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      environments: {
        web: {},
        web1: {
          dev: {
            assetPrefix: 'auto',
          },
          source: {
            entry: {
              main: './src/web1.js',
            },
          },
          output: {
            distPath: {
              root: 'dist1',
              html: 'html1',
            },
          },
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}/dist`);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await page.goto(`http://localhost:${rsbuild.port}/dist1/html1/main`);

  const locator1 = page.locator('#test');
  await expect(locator1).toHaveText('Hello Rsbuild (web1)!');

  await rsbuild.close();
});
