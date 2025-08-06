import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to dynamic import a Wasm file', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.getDistFiles();

  const wasmFile = Object.keys(files).find((file) =>
    file.endsWith('.module.wasm'),
  );

  expect(wasmFile).toBeTruthy();
  expect(/static[\\/]wasm/g.test(wasmFile!)).toBeTruthy();
});
