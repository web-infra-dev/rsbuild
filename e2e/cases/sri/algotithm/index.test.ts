import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('generate integrity using sha512 algorithm', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toMatch(
    /<script defer="defer" src="\/static\/js\/index\.\w{8}\.js" integrity="sha512-[A-Za-z0-9+\/=]+"/,
  );

  expect(html).toMatch(
    /link href="\/static\/css\/index\.\w{8}\.css" rel="stylesheet" integrity="sha512-[A-Za-z0-9+\/=]+"/,
  );

  await gotoPage(page, rsbuild);
  const testEl = page.locator('#root');
  await expect(testEl).toHaveText('Hello Rsbuild!');
  await rsbuild.close();
});
