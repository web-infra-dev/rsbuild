import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow to custom the filename hash of Wasm files',
  async ({ buildPreview }) => {
    const rsbuild = await buildPreview();
    const files = rsbuild.getDistFiles();

    const wasmFile = Object.keys(files).find((file) =>
      file.endsWith('module.wasm'),
    );

    expect(/[a-f0-9]{16}\.module\.wasm/.test(wasmFile!)).toBeTruthy();
  },
);
