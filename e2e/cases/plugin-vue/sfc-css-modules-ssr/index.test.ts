import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should build Vue SFC with CSS Modules correctly in dev build for node target',
  async ({ dev }) => {
    const rsbuild = await dev();

    const files = rsbuild.getDistFiles();
    const indexJs =
      files[Object.keys(files).find((file) => file.endsWith('index.js'))!];
    expect(indexJs).toMatch(/`src-App__red-\w{6}`/);
    expect(indexJs).toMatch(/`src-App__blue-\w{6}`/);
  },
);

rspackTest(
  'should build Vue SFC with CSS Modules correctly in build for node target',
  async ({ buildPreview }) => {
    const rsbuild = await buildPreview();

    const files = rsbuild.getDistFiles();
    const indexJs =
      files[Object.keys(files).find((file) => file.endsWith('index.js'))!];
    expect(indexJs).toMatch(/"red-\w{6}"/);
    expect(indexJs).toMatch(/"blue-\w{6}"/);
  },
);
