import path from 'node:path';

import { expect, test } from '@e2e/helper';

test('should build web-worker target correctly', async ({ build }) => {
  const rsbuild = await build({
    rsbuildConfig: {
      output: {
        target: 'web-worker',
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);
  const jsFiles = filenames.filter((item) => item.endsWith('.js'));

  expect(jsFiles.length).toEqual(1);
  expect(jsFiles[0].includes('index')).toBeTruthy();
});

test('should build web-worker target with dynamicImport correctly', async ({
  build,
}) => {
  const rsbuild = await build({
    rsbuildConfig: {
      source: {
        entry: { index: path.resolve(__dirname, './src/index2.js') },
      },
      output: {
        target: 'web-worker',
      },
    },
  });
  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);
  const jsFiles = filenames.filter((item) => item.endsWith('.js'));

  expect(jsFiles.length).toEqual(1);
  expect(jsFiles[0].includes('index')).toBeTruthy();
});
