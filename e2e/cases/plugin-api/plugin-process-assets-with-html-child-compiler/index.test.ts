import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow plugin to process assets',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();

    const files = rsbuild.getDistFiles();
    const indexJs = Object.keys(files).find(
      (file) => file.includes('index') && file.endsWith('.js'),
    );
    const indexCss = Object.keys(files).find(
      (file) => file.includes('index') && file.endsWith('.css'),
    );

    expect(indexJs).toBeTruthy();
    expect(indexCss).toBeFalsy();
  },
);
