import path from 'node:path';
import { expect, test } from '@playwright/test';
import { build } from '@e2e/helper';

test('should build web-worker target correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        targets: ['web-worker'],
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();
  const filenames = Object.keys(files);
  const jsFiles = filenames.filter((item) => item.endsWith('.js'));

  expect(jsFiles.length).toEqual(1);
  expect(jsFiles[0].includes('index')).toBeTruthy();
});

test('should build web-worker target with dynamicImport correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: { index: path.resolve(__dirname, './src/index2.js') },
      },
      output: {
        targets: ['web-worker'],
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON();
  const filenames = Object.keys(files);
  const jsFiles = filenames.filter((item) => item.endsWith('.js'));

  expect(jsFiles.length).toEqual(1);
  expect(jsFiles[0].includes('index')).toBeTruthy();
});
