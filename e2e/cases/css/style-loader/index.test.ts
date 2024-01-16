import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test('should inline style when injectStyles is true', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    runServer: true,
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        injectStyles: true,
      },
    },
  });

  await gotoPage(page, rsbuild);

  // injectStyles worked
  const files = await rsbuild.unwrapOutputJSON();
  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
  expect(cssFiles.length).toBe(0);

  // should inline minified css
  const indexJsFile = Object.keys(files).find(
    (file) => file.includes('index.') && file.endsWith('.js'),
  )!;

  expect(files[indexJsFile].includes('padding: 0;')).toBeTruthy();
  expect(files[indexJsFile].includes('margin: 0;')).toBeTruthy();
  expect(files[indexJsFile].includes('text-align: center;')).toBeTruthy();

  // scss worked
  const header = page.locator('#header');
  await expect(header).toHaveCSS('font-size', '20px');

  // less worked
  const title = page.locator('#header');
  await expect(title).toHaveCSS('font-size', '20px');

  await rsbuild.close();
});
