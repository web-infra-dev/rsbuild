import { expect, findFile, rspackTest } from '@e2e/helper';

rspackTest(
  'should not allow to disable filename hash of Wasm files',
  async ({ buildPreview }) => {
    const rsbuild = await buildPreview();
    const files = rsbuild.getDistFiles();

    const wasmFile = findFile(files, 'module.wasm');

    expect(/[a-f0-9]{8}\.module\.wasm/.test(wasmFile)).toBeTruthy();
  },
);
