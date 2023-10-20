import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should compile common css import correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
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

  expect(files[cssFiles]).toEqual(
    'html{min-height:100%}#a{color:red}#b{color:blue}',
  );
});
