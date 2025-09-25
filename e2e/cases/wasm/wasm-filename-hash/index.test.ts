import { expect, findFile, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow to custom the filename hash of Wasm files',
  async ({ buildPreview }) => {
    const rsbuild = await buildPreview();
    const files = rsbuild.getDistFiles();

    const wasmFile = findFile(files, 'module.wasm');

    expect(/[a-f0-9]{16}\.module\.wasm/.test(wasmFile)).toBeTruthy();
  },
);
