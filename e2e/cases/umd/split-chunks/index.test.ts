import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to configure split chunks with UMD plugin', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const indexBundle =
    files[Object.keys(files).find((file) => file.endsWith('index.js'))!];
  const reactBundle =
    files[Object.keys(files).find((file) => file.endsWith('lib-react.js'))!];
  expect(indexBundle).toBeTruthy();
  expect(reactBundle).toBeTruthy();

  await gotoPage(page, rsbuild);
  const test = page.locator('#test');
  await expect(test).toHaveText('2');

  await rsbuild.close();
});
