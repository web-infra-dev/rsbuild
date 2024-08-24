import { build, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should allow to enable Rspack experiments.css', async () => {
  const { logs, restore } = proxyConsole();

  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.unwrapOutputJSON();
  const content =
    files[Object.keys(files).find((file) => file.endsWith('index.css'))!];

  expect(content).toEqual('body{color:red}');
  // should have no warnings
  expect(logs.some((log) => log.includes('Compile Warning'))).toBeFalsy();

  restore();
});

rspackOnlyTest(
  'should allow to enable Rspack experiments.css with style-loader',
  async () => {
    const { logs, restore } = proxyConsole();

    const rsbuild = await build({
      cwd: __dirname,
      rsbuildConfig: {
        output: {
          injectStyles: true,
        },
      },
    });

    const files = await rsbuild.unwrapOutputJSON();
    const content =
      files[Object.keys(files).find((file) => file.endsWith('index.js'))!];
    expect(content).toContain('color:red');

    // should have no warnings
    expect(logs.some((log) => log.includes('Compile Warning'))).toBeFalsy();

    restore();
  },
);
