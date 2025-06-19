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

test('should apply nonce to preload script tags', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      performance: {
        preload: true,
      },
    },
  });
  const files = await rsbuild.getDistFiles();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain(
    `rel="preload" as="script" nonce="CSP_NONCE_PLACEHOLDER">`,
  );
});
