import { expect, test } from '@playwright/test';
import { build, proxyConsole } from '@e2e/helper';

test('should compile common css import correctly', async () => {
  const { restore, logs } = proxyConsole();

  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
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
    'html{min-height:100%}#a{color:red}#b{color:blue}',
  );

  restore();
});
