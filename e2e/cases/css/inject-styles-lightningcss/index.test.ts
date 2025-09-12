import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should use lightningcss-loader to transform and minify CSS when injectStyles is true',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();

    // injectStyles worked
    const files = rsbuild.getDistFiles();

    // should inline minified CSS
    const indexJsFile = Object.keys(files).find(
      (file) => file.includes('index.') && file.endsWith('.js'),
    )!;

    expect(
      files[indexJsFile].includes(
        '@media (-webkit-min-device-pixel-ratio:2),(min-resolution:2dppx){.item{-webkit-user-select:none;user-select:none;background:linear-gradient(#fff,#000);transition:all .5s}}',
      ),
    ).toBeTruthy();
  },
);
