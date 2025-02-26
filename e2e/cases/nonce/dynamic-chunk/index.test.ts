import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should apply nonce to dynamic chunks in dev build', async ({ page }) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.dynamicChunkNonce')).toEqual(
    'CSP_NONCE_PLACEHOLDER',
  );

  await rsbuild.close();
});

test('should apply nonce to dynamic chunks in prod build', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });

  expect(await page.evaluate('window.dynamicChunkNonce')).toEqual(
    'CSP_NONCE_PLACEHOLDER',
  );

  await rsbuild.close();
});
