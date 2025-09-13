import { expect, test } from '@e2e/helper';

test('should inject rem runtime code with nonce', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(html).toContain(
    `<script nonce="CSP_NONCE_PLACEHOLDER">function setRootPixel`,
  );
});
