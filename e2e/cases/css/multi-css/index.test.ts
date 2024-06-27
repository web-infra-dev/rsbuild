import path from 'node:path';
import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should emit multiple css files correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        entry: {
          entry1: path.resolve(__dirname, './src/entry1/index.js'),
          entry2: path.resolve(__dirname, './src/entry2/index.js'),
          entry3: path.resolve(__dirname, './src/entry3/index.js'),
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();
  const entry1CSS = Object.keys(files).find(
    (file) => file.includes('entry1') && file.endsWith('.css'),
  )!;
  const entry2CSS = Object.keys(files).find(
    (file) => file.includes('entry2') && file.endsWith('.css'),
  )!;
  const entry3CSS = Object.keys(files).find(
    (file) => file.includes('entry3') && file.endsWith('.css'),
  )!;

  expect(files[entry1CSS]).toContain('#entry1{color:red}');
  expect(files[entry2CSS]).toContain('#entry2{color:#00f}');
  expect(files[entry3CSS]).toContain('#entry3{color:green}');
});
