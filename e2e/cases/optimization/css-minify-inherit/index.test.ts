import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should let lightningcss minimizer inherit from tools.lightningcssLoader',
  async ({ dev, buildOnly }) => {
    const rsbuild = await dev();
    const devFiles = rsbuild.getDistFiles();
    const devContent =
      devFiles[
        Object.keys(devFiles).find((file) => file.endsWith('css/index.css'))!
      ];
    expect(devContent).toContain('margin-inline-end: 100px;');

    const rsbuild2 = await buildOnly();
    const buildFiles = rsbuild2.getDistFiles();
    const buildContent =
      buildFiles[
        Object.keys(buildFiles).find((file) => file.endsWith('css/index.css'))!
      ];
    expect(buildContent).toContain('margin-inline-end:100px');
    await rsbuild2.close();
  },
);
