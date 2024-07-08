import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const fixtures = __dirname;

test('should minify template success when inlineScripts & inlineStyles', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: fixtures,
    runServer: true,
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

  await gotoPage(page, rsbuild);

  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.html'))!];

  expect(content.includes('html,body{margin:0;padding:0}')).toBeTruthy();
  expect(content.includes('let n=document.createElement("div")')).toBeTruthy();

  await rsbuild.close();
});
