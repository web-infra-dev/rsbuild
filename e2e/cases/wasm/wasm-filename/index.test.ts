import { expect, findFile, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow to custom the filename of Wasm files',
  async ({ buildPreview }) => {
    const rsbuild = await buildPreview();
    const files = rsbuild.getDistFiles();

    const wasmFile = findFile(files, 'factorial.wasm');

    expect(wasmFile).toBeTruthy();
  },
);
