import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow plugin to transform code and call `importModule`',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });

    const files = rsbuild.getDistFiles();
    const indexCss = Object.keys(files).find(
      (file) => file.includes('index') && file.endsWith('.css'),
    );

    expect(files[indexCss!].includes('#00f')).toBeTruthy();
  },
);
