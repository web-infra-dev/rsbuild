import { expect, test } from '@playwright/test';
import { build, getHrefByEntryName } from '../../../scripts/shared';

test('tsconfig paths should work and override the alias config', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await page.goto(getHrefByEntryName('index', rsbuild.port));

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('tsconfig paths worked');

  await rsbuild.close();
});
