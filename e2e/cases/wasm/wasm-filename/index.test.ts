import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to custom the filename of Wasm files', async ({ page }) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
  });
  const files = await rsbuild.getDistFiles();

  const wasmFile = Object.keys(files).find((file) =>
    file.endsWith('factorial.wasm'),
  );

  expect(wasmFile).toBeTruthy();
  await rsbuild.close();
});
