import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow plugin to transform code and call `importModule`',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();
    const files = rsbuild.getDistFiles();
    const indexCss = Object.keys(files).find(
      (file) => file.includes('index') && file.endsWith('.css'),
    );

    expect(files[indexCss!].includes('#00f')).toBeTruthy();
  },
);
