import { expect, getFileContent, rspackTest } from '@e2e/helper';

rspackTest(
  'should add vendor prefixes by current browserslist',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();

    const content = getFileContent(files, '.css');

    expect(content).toEqual(
      '@media (-webkit-min-device-pixel-ratio:2),(min-resolution:2dppx){.item{-webkit-user-select:none;-ms-user-select:none;user-select:none;background:-webkit-linear-gradient(#000,#fff);background:linear-gradient(#fff,#000);-webkit-transition:all .5s;transition:all .5s}}',
    );
  },
);

rspackTest(
  'should add vendor prefixes by current browserslist in dev',
  async ({ dev }) => {
    const rsbuild = await dev();

    const distFiles = rsbuild.getDistFiles();
    const content = getFileContent(distFiles, 'css/index.css');
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
  },
);
