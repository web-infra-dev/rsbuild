import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow plugin to transform code and call `importModule`',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();
    const indexCss = Object.keys(files).find(
      (file) => file.includes('index') && file.endsWith('.css'),
    );

    expect(files[indexCss!].includes('#00f')).toBeTruthy();
  },
);
