import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackOnlyTest } from '@e2e/helper';

const fixtures = __dirname;

rspackOnlyTest(
  'should inline style when `injectStyles` is enabled',
  async ({ page, build }) => {
    const rsbuild = await build();

    // injectStyles worked
    const files = rsbuild.getDistFiles();
    const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
    expect(cssFiles.length).toBe(0);

    // should inline minified CSS
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
  },
);

rspackOnlyTest(
  'HMR should work well when `injectStyles` is enabled',
  async ({ page, dev }) => {
    await fs.promises.cp(
      join(fixtures, 'src'),
      join(fixtures, 'test-temp-src'),
      { recursive: true },
    );

    const rsbuild = await dev({
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

    // CSS HMR works well
    await expect(title).toHaveCSS('font-size', '40px');

    // #test-keep should unchanged when CSS HMR
    expect(await locatorKeep.innerHTML()).toBe(keepNum);
  },
);

rspackOnlyTest(
  'should allow to disable CSS minification when `injectStyles` is enabled',
  async ({ page, build }) => {
    const rsbuild = await build({
      rsbuildConfig: {
        output: {
          minify: false,
        },
      },
    });

    // injectStyles worked
    const files = rsbuild.getDistFiles();
    const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
    expect(cssFiles.length).toBe(0);

    // should inline CSS
    const indexJsFile = Object.keys(files).find(
      (file) => file.includes('index.') && file.endsWith('.js'),
    )!;

    expect(
      files[indexJsFile].includes(`html, body {
  margin: 0;
  padding: 0;
}`),
    ).toBeTruthy();
  },
);
