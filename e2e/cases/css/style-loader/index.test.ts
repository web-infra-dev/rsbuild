import { join } from 'path';
import { build, getHrefByEntryName } from '@scripts/shared';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test('should inline style when disableCssExtract is false', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.ts'),
    },
    runServer: true,
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        disableCssExtract: true,
      },
    },
  });

  await page.goto(getHrefByEntryName('main', rsbuild.port));

  // disableCssExtract worked
  const files = await rsbuild.unwrapOutputJSON();
  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
  expect(cssFiles.length).toBe(0);

  // should inline minified css
  const mainJsFile = Object.keys(files).find(
    (file) => file.includes('main.') && file.endsWith('.js'),
  )!;
  expect(
    files[mainJsFile].includes(
      'html,\\nbody {\\n  padding: 0;\\n  margin: 0;\\n}\\n\\n* {\\n  -webkit-font-smoothing: antialiased;\\n  -moz-osx-font-smoothing: grayscale;\\n  box-sizing: border-box;\\n}\\n\\n.description {\\n  text-align: center;\\n  line-height: 1.5;\\n  font-size: 16px;',
    ),
  ).toBeTruthy();

  // scss worked
  const header = page.locator('#header');
  await expect(header).toHaveCSS('font-size', '20px');

  // less worked
  const title = page.locator('#header');
  await expect(title).toHaveCSS('font-size', '20px');

  rsbuild.close();
});
