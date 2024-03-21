import { expect, test } from '@playwright/test';
import { dev, build, gotoPage } from '@e2e/helper';

test('should apply nonce to dynamic chunks in dev build', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.dynamicChunkNonce')).toEqual(
    'CSP_NONCE_PLACEHOLDER',
  );

  await rsbuild.close();
});

test('should apply nonce to dynamic chunks in prod build', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    runServer: true,
  });

  await gotoPage(page, rsbuild);
  expect(await page.evaluate('window.dynamicChunkNonce')).toEqual(
    'CSP_NONCE_PLACEHOLDER',
  );

  await rsbuild.close();
});
