import { expect, test } from '@e2e/helper';

test('should allow to dynamic import a Wasm file', async ({ buildOnly }) => {
  const rsbuild = await buildOnly();
  const files = rsbuild.getDistFiles();
  const wasmFile = Object.keys(files).find((file) =>
    file.endsWith('.module.wasm'),
  );

  expect(wasmFile).toBeTruthy();
  expect(/static[\\/]wasm/g.test(wasmFile!)).toBeTruthy();
});
