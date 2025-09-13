import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to custom the filename of Wasm files',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();

    const wasmFile = Object.keys(files).find((file) =>
      file.endsWith('factorial.wasm'),
    );

    expect(wasmFile).toBeTruthy();
  },
);
