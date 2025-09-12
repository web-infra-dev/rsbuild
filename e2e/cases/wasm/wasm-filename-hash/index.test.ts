import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to custom the filename hash of Wasm files',
  async ({ page, build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();

    const wasmFile = Object.keys(files).find((file) =>
      file.endsWith('module.wasm'),
    );

    expect(/[a-f0-9]{16}\.module\.wasm/.test(wasmFile!)).toBeTruthy();
  },
);
