import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
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

rspackOnlyTest(
  'should build Vue SFC with CSS Modules correctly in build for node target',
  async ({ page, build }) => {
    const rsbuild = await build();

    const files = rsbuild.getDistFiles();
    const indexJs =
      files[Object.keys(files).find((file) => file.endsWith('index.js'))!];
    expect(indexJs).toMatch(/"red-\w{6}"/);
    expect(indexJs).toMatch(/"blue-\w{6}"/);
  },
);
