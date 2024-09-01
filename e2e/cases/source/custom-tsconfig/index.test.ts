import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('tsconfig paths should work and override the alias config', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  const foo = page.locator('#foo');
  await expect(foo).toHaveText('tsconfig paths worked');

  await rsbuild.close();
});
