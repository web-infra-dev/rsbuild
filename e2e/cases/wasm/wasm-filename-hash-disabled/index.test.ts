import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should not allow to disable filename hash of Wasm files',
  async ({ page, build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();

    const wasmFile = Object.keys(files).find((file) =>
      file.endsWith('module.wasm'),
    );

    expect(/[a-f0-9]{8}\.module\.wasm/.test(wasmFile!)).toBeTruthy();
  },
);
