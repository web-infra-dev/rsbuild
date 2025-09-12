import { expect, test } from '@e2e/helper';

declare global {
  interface Window {
    dynamicChunkNonce?: string;
  }
}

test('should apply nonce to dynamic chunks in dev build', async ({
  page,
  dev,
}) => {
  await dev();

  await page.waitForFunction(
    () => window.dynamicChunkNonce !== undefined,
    undefined,
    {
      timeout: 2000,
    },
  );

  expect(await page.evaluate('window.dynamicChunkNonce')).toEqual(
    'CSP_NONCE_PLACEHOLDER',
  );
});

test('should apply nonce to dynamic chunks in build', async ({
  page,
  build,
}) => {
  const rsbuild = await build();

  expect(await page.evaluate('window.dynamicChunkNonce')).toEqual(
    'CSP_NONCE_PLACEHOLDER',
  );
});

test('should apply nonce to preload script tags', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      performance: {
        preload: true,
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];

  expect(html).toContain(
    `rel="preload" as="script" nonce="CSP_NONCE_PLACEHOLDER">`,
  );
});
