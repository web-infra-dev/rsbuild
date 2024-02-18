import path from 'node:path';
import { expect, test } from '@playwright/test';
import { build, gotoPage } from '@e2e/helper';

test('should allow to build web-worker with new Worker', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);
  await expect(page.locator('#root')).toHaveText(
    'The Answer to the Ultimate Question of Life, The Universe, and Everything: 42',
  );
});
