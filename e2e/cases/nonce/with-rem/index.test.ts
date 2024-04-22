import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should inject rem runtime code with nonce', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(html).toContain(
    `<script nonce="CSP_NONCE_PLACEHOLDER">function setRootPixel`,
  );
});
