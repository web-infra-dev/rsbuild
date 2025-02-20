import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

const fixtures = __dirname;

rspackOnlyTest(
  'should minify template success when inlineScripts & inlineStyles',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: fixtures,
      page,
      rsbuildConfig: {
        html: {
          template: './static/index.html',
          // avoid Minified React error #200;
          inject: 'body',
        },
        output: {
          inlineScripts: true,
          inlineStyles: true,
        },
      },
    });

    const files = await rsbuild.unwrapOutputJSON();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.html'))!];

    expect(content.includes('html,body{margin:0;padding:0}')).toBeTruthy();
    expect(
      content.includes('let n=document.createElement("div")'),
    ).toBeTruthy();

    await rsbuild.close();
  },
);
