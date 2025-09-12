import { expect, rspackOnlyTest } from '@e2e/helper';

const COMPILE_WARNING = 'Compile Warning';

rspackOnlyTest(
  'should allow to enable Rspack experiments.css',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();
    const files = rsbuild.getDistFiles();
    const content =
      files[Object.keys(files).find((file) => file.endsWith('index.css'))!];

    expect(content).toEqual('body{color:red}');
    // should have no warnings
    rsbuild.expectNoLog(COMPILE_WARNING);
  },
);

rspackOnlyTest(
  'should allow to enable Rspack experiments.css with style-loader',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly({
      rsbuildConfig: {
        output: {
          injectStyles: true,
        },
      },
    });

    const files = rsbuild.getDistFiles();
    const content =
      files[Object.keys(files).find((file) => file.endsWith('index.js'))!];
    expect(content).toContain('color:red');

    // should have no warnings
    rsbuild.expectNoLog(COMPILE_WARNING);
  },
);
