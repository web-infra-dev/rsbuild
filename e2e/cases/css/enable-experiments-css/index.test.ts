import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

const COMPILE_WARNING = 'Compile Warning';

rspackOnlyTest('should allow to enable Rspack experiments.css', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = rsbuild.getDistFiles();
  const content =
    files[Object.keys(files).find((file) => file.endsWith('index.css'))!];

  expect(content).toEqual('body{color:red}');
  // should have no warnings
  rsbuild.expectNoLog(COMPILE_WARNING);

  await rsbuild.close();
});

rspackOnlyTest(
  'should allow to enable Rspack experiments.css with style-loader',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
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

    await rsbuild.close();
  },
);
