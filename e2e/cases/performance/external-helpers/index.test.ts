import path from 'node:path';
import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('should externalHelpers by default', async ({ buildOnly }) => {
  const rsbuild = await buildOnly({
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
