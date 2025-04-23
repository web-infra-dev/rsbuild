import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

import { pluginReact } from '@rsbuild/plugin-react';

test('should add single environment plugin correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      environments: {
        web: {
          output: {
            filenameHash: false,
          },
          plugins: [pluginReact()],
        },
        web1: {
          source: {
            entry: {
              main: './src/index1.ts',
            },
          },
          output: {
            assetPrefix: 'auto',
            filenameHash: false,
            distPath: {
              root: 'dist/web1',
            },
          },
        },
      },
    },
    page,
  });

  const button = page.locator('#test');
  await expect(button).toHaveText('Hello Rsbuild!');

  const web1Url = new URL(`http://localhost:${rsbuild.port}/web1/main`);

  await page.goto(web1Url.href);

  await expect(page.locator('#test1')).toHaveText('Hello Rsbuild!');

  const files = await rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/js/lib-react.js'),
    ),
  ).toBeTruthy();
  expect(
    filenames.some((filename) =>
      filename.includes('dist/web1/static/js/lib-react.js'),
    ),
  ).toBeFalsy();
});
