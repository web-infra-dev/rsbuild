import { join } from 'node:path';
import { build, dev, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';

const fixtures = __dirname;

test('should inline style when injectStyles is true', async ({ page }) => {
  const rsbuild = await build({
    cwd: fixtures,
    runServer: true,
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
  const title = page.locator('#title');
  await expect(title).toHaveCSS('font-size', '20px');

  await rsbuild.close();
});

rspackOnlyTest(
  'hmr should work well when injectStyles is true',
  async ({ page }) => {
    // HMR cases will fail in Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    await fse.copy(join(fixtures, 'src'), join(fixtures, 'test-temp-src'));

    const rsbuild = await dev({
      cwd: fixtures,
      rsbuildConfig: {
        source: {
          entry: {
            index: join(fixtures, 'test-temp-src/index.ts'),
          },
        },
      },
    });

    await gotoPage(page, rsbuild);

    // scss worked
    const header = page.locator('#header');
    await expect(header).toHaveCSS('font-size', '20px');

    // less worked
    const title = page.locator('#title');
    await expect(title).toHaveCSS('font-size', '20px');

    const locatorKeep = page.locator('#test-keep');
    const keepNum = await locatorKeep.innerHTML();

    const filePath = join(fixtures, 'test-temp-src/App.module.less');

    await fse.writeFile(
      filePath,
      fse.readFileSync(filePath, 'utf-8').replace('20px', '40px'),
    );

    // css hmr works well
    await expect(title).toHaveCSS('font-size', '40px');

    // #test-keep should unchanged when css hmr
    await expect(locatorKeep.innerHTML()).resolves.toBe(keepNum);

    await rsbuild.close();
  },
);
