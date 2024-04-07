import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';

test('should apply nonce to script and style tags', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();
  const html =
    files[Object.keys(files).find((file) => file.endsWith('index.html'))!];
  expect(html).toContain(
    `<script defer="defer" nonce="CSP_NONCE_PLACEHOLDER">`,
  );
  expect(html).toContain(`<style nonce="CSP_NONCE_PLACEHOLDER">body{`);
});
