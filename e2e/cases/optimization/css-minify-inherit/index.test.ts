import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should let lightningcss minimizer inherit from tools.lightningcssLoader',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });
    const devFiles = rsbuild.getDistFiles();
    const devContent =
      devFiles[
        Object.keys(devFiles).find((file) => file.endsWith('css/index.css'))!
      ];
    expect(devContent).toContain('margin-inline-end: 100px;');
    await rsbuild.close();

    const rsbuild2 = await build({
      cwd: __dirname,
    });
    const buildFiles = rsbuild2.getDistFiles();
    const buildContent =
      buildFiles[
        Object.keys(buildFiles).find((file) => file.endsWith('css/index.css'))!
      ];
    expect(buildContent).toContain('margin-inline-end:100px');
    await rsbuild2.close();
  },
);
