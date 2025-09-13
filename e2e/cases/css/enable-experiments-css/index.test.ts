import { expect, rspackTest } from '@e2e/helper';

const COMPILE_WARNING = 'Compile Warning';

rspackTest(
  'should allow to enable Rspack experiments.css',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();
    const content =
      files[Object.keys(files).find((file) => file.endsWith('index.css'))!];

    expect(content).toEqual('body{color:red}');
    // should have no warnings
    rsbuild.expectNoLog(COMPILE_WARNING);
  },
);

rspackTest(
  'should allow to enable Rspack experiments.css with style-loader',
  async ({ build }) => {
    const rsbuild = await build({
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
