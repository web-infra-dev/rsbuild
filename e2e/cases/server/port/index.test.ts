import { dev, getRandomPort, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to set port via server.port', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  const port = await getRandomPort();
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      server: {
        port,
      },
    },
  });

  await gotoPage(page, rsbuild);

  expect(rsbuild.port).toBe(port);

  const locator = page.locator('#test');
  await expect(locator).toHaveText('Hello Rsbuild!');

  await rsbuild.close();

  expect(errors).toEqual([]);
});
