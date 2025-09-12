import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should add vendor prefixes by current browserslist',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toEqual(
      '@media (-webkit-min-device-pixel-ratio:2),(min-resolution:2dppx){.item{-webkit-user-select:none;-ms-user-select:none;user-select:none;background:-webkit-linear-gradient(#000,#fff);background:linear-gradient(#fff,#000);-webkit-transition:all .5s;transition:all .5s}}',
    );
  },
);

rspackOnlyTest(
  'should add vendor prefixes by current browserslist in dev',
  async ({ page }) => {
    const rsbuild = await dev({
      cwd: __dirname,
      page,
    });

    const distFiles = rsbuild.getDistFiles();
    const content =
      distFiles[
        Object.keys(distFiles).find((file) => file.endsWith('css/index.css'))!
      ];
    expect(content).toContain(
      `@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
  .item {
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    background: -webkit-linear-gradient(top, #fff, #000);
    background: linear-gradient(#fff, #000);
    -webkit-transition: all .5s;
    transition: all .5s;
  }
}`,
    );

    await rsbuild.close();
  },
);
