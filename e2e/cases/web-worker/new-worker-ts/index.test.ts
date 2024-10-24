import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to build web-worker with new Worker', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  await expect(page.locator('#root')).toHaveText(
    'The Answer to the Ultimate Question of Life, The Universe, and Everything: 42',
  );

  await rsbuild.close();
});

test('should allow to build web-worker with new Worker in dev mode', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  await expect(page.locator('#root')).toHaveText(
    'The Answer to the Ultimate Question of Life, The Universe, and Everything: 42',
  );

  await rsbuild.close();
});
