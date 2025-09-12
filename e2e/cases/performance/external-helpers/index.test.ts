import path from 'node:path';
import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should externalHelpers by default', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: { index: path.resolve(__dirname, './src/main.ts') },
        decorators: {
          version: '2022-03',
        },
      },
      output: {
        sourceMap: {
          js: 'source-map',
        },
      },
    },
  });
  const files = rsbuild.getDistFiles({ sourceMaps: true });

  const content =
    files[
      Object.keys(files).find(
        (file) => file.includes('static/js') && file.endsWith('.js.map'),
      )!
    ];

  expect(content).toContain('@swc/helpers');
});
