import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should not allow to disable filename hash of Wasm files',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });
    const files = await rsbuild.getDistFiles();

    const wasmFile = Object.keys(files).find((file) =>
      file.endsWith('module.wasm'),
    );

    expect(/[a-f0-9]{8}\.module\.wasm/.test(wasmFile!)).toBeTruthy();
    await rsbuild.close();
  },
);
