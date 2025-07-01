import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should build Vue SFC with CSS Modules correctly in dev build for node target',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    const files = await rsbuild.getDistFiles();
    const indexJs =
      files[Object.keys(files).find((file) => file.endsWith('index.js'))!];
    expect(indexJs).toMatch(/`src-App__red-\w{6}`/);
    expect(indexJs).toMatch(/`src-App__blue-\w{6}`/);
    await rsbuild.close();
  },
);

rspackOnlyTest(
  'should build Vue SFC with CSS Modules correctly in prod build for node target',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
    });

    const files = await rsbuild.getDistFiles();
    const indexJs =
      files[Object.keys(files).find((file) => file.endsWith('index.js'))!];
    expect(indexJs).toMatch(/"red-\w{6}"/);
    expect(indexJs).toMatch(/"blue-\w{6}"/);
    await rsbuild.close();
  },
);
