import { expect, test } from '@playwright/test';
import { dev, build, gotoPage } from '@e2e/helper';

test('should run swc warm plugin correctly in dev mode', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
  });

  const msgPromise = page.waitForEvent('console');
  await gotoPage(page, rsbuild);

  const msg = await msgPromise;
  expect(await msg.args()[0].jsonValue()).toEqual('this is error');

  await rsbuild.close();
});

test('should run swc warm plugin correctly in production build', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  const msgPromise = page.waitForEvent('console');
  await gotoPage(page, rsbuild);

  const msg = await msgPromise;
  expect(await msg.args()[0].jsonValue()).toEqual('this is error');

  await rsbuild.close();
});
