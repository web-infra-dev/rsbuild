import { build, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should compile common CSS import correctly', async () => {
  const { restore, logs } = proxyConsole();

  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      resolve: {
        alias: {
          '@': './src',
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  // there will be a deprecation log for `~`.
  expect(
    logs.some((log) => log.includes(`a request starts with '~' is deprecated`)),
  );

  expect(files[cssFiles]).toEqual(
    'html{min-height:100%}#a{color:red}#b{color:#00f}',
  );

  restore();
});
