import { build, dev, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should exports global in CSS Modules correctly in dev build', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
  });

  await gotoPage(page, rsbuild);

  const test1Locator = page.locator('#test1');
  await expect(test1Locator).toHaveCSS('color', 'rgb(255, 0, 0)');

  const test2Locator = page.locator('#test2');
  await expect(test2Locator).toHaveCSS('color', 'rgb(0, 0, 255)');

  await rsbuild.close();
});

test('should exports global in CSS Modules correctly in prod build', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });
  await gotoPage(page, rsbuild);

  const test1Locator = page.locator('#test1');
  await expect(test1Locator).toHaveCSS('color', 'rgb(255, 0, 0)');

  const test2Locator = page.locator('#test2');
  await expect(test2Locator).toHaveCSS('color', 'rgb(0, 0, 255)');

  await rsbuild.close();

  const files = await rsbuild.unwrapOutputJSON();
  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];
  expect(content).toMatch(/\.foo-\w{6}{color:red}\.bar{color:blue}/);
});
