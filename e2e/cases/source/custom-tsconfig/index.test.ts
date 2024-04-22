import { build, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('tsconfig paths should work and override the alias config', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('tsconfig paths worked');

  await rsbuild.close();
});
