import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should exclude specified less file', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    rsbuildConfig: {
      tools: {
        less: (opts, { addExcludes }) => {
          addExcludes([/b\.less$/]);
        },
      },
      output: {
        enableAssetFallback: true,
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();
  const cssFiles = Object.keys(files).filter((file) => file.endsWith('.css'));
  const lessFiles = Object.keys(files).filter((file) => file.endsWith('.less'));

  expect(lessFiles.length).toBe(1);
  expect(cssFiles.length).toBe(1);
});
