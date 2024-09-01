import fs from 'node:fs';
import { join } from 'node:path';
import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const fixtures = __dirname;

rspackOnlyTest(
  'should inline style when injectStyles is true',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: fixtures,
      page,
    });

    // injectStyles worked
    const files = await rsbuild.unwrapOutputJSON();
    const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
    expect(cssFiles.length).toBe(0);

    // should inline minified css
    const indexJsFile = Object.keys(files).find(
      (file) => file.includes('index.') && file.endsWith('.js'),
    )!;

    expect(
      files[indexJsFile].includes('html,body{margin:0;padding:0}'),
    ).toBeTruthy();
    expect(
      files[indexJsFile].includes(
        '.description{text-align:center;font-size:16px;line-height:1.5}',
      ),
    ).toBeTruthy();

    // scss worked
    const header = page.locator('#header');
    await expect(header).toHaveCSS('font-size', '20px');

    // less worked
    const title = page.locator('#title');
    await expect(title).toHaveCSS('font-size', '20px');

    await rsbuild.close();
  },
);

rspackOnlyTest(
  'hmr should work well when injectStyles is true',
  async ({ page }) => {
    // HMR cases will fail in Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    await fs.promises.cp(
      join(fixtures, 'src'),
      join(fixtures, 'test-temp-src'),
      { recursive: true },
    );

    const rsbuild = await dev({
      cwd: fixtures,
      page,
      rsbuildConfig: {
        source: {
          entry: {
            index: join(fixtures, 'test-temp-src/index.ts'),
          },
        },
      },
    });

    // scss worked
    const header = page.locator('#header');
    await expect(header).toHaveCSS('font-size', '20px');

    // less worked
    const title = page.locator('#title');
    await expect(title).toHaveCSS('font-size', '20px');

    const locatorKeep = page.locator('#test-keep');
    const keepNum = await locatorKeep.innerHTML();

    const filePath = join(fixtures, 'test-temp-src/App.module.less');

    await fs.promises.writeFile(
      filePath,
      fs.readFileSync(filePath, 'utf-8').replace('20px', '40px'),
    );

    // css hmr works well
    await expect(title).toHaveCSS('font-size', '40px');

    // #test-keep should unchanged when css hmr
    await expect(locatorKeep.innerHTML()).resolves.toBe(keepNum);

    await rsbuild.close();
  },
);
