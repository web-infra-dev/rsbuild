import { build, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should render MDX with Vue correctly', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);
  expect(await page.innerHTML('h1')).toEqual('Hello, world!');
  expect(await page.innerHTML('#test')).toEqual(
    '<p style="padding: 1rem;">Test</p>',
  );

  await rsbuild.close();
});
