import { join, resolve } from 'node:path';
import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';
import { fse } from '@rsbuild/shared';

const fixtures = resolve(__dirname);

test('enableCssModuleTSDeclaration', async () => {
  fse.removeSync(join(fixtures, 'src/App.module.less.d.ts'));
  fse.removeSync(join(fixtures, 'src/App.module.scss.d.ts'));

  await build({
    cwd: fixtures,
    plugins: [pluginReact(), pluginTypedCSSModules()],
  });

  expect(
    fse.existsSync(join(fixtures, 'src/App.module.less.d.ts')),
  ).toBeTruthy();

  expect(
    fse
      .readFileSync(join(fixtures, 'src/App.module.less.d.ts'), {
        encoding: 'utf-8',
      })
      .includes('title: string;'),
  ).toBeTruthy();

  expect(
    fse.existsSync(join(fixtures, 'src/App.module.scss.d.ts')),
  ).toBeTruthy();

  expect(
    fse
      .readFileSync(join(fixtures, 'src/App.module.scss.d.ts'), {
        encoding: 'utf-8',
      })
      .includes('header: string;'),
  ).toBeTruthy();
});

test('injectStyles', async ({ page }) => {
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

  // scss worked
  const header = page.locator('#header');
  await expect(header).toHaveCSS('font-size', '20px');

  // less worked
  const title = page.locator('#title');
  await expect(title).toHaveCSS('font-size', '20px');

  await rsbuild.close();
});
