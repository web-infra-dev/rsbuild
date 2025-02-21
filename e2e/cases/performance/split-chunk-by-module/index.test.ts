import { basename } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

test('should generate module chunks when chunkSplit is "split-by-module"', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        filenameHash: false,
      },
      performance: {
        chunkSplit: {
          strategy: 'split-by-module',
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const [reactFile] = Object.entries(files).find(
    ([name, content]) =>
      name.includes('npm.react') && content.includes('React'),
  )!;
  expect(reactFile).toBeTruthy();

  const jsFiles = Object.keys(files)
    .filter((name) => name.endsWith('.js'))
    .map((name) => basename(name));

  expect(jsFiles.length).toEqual(4);
  expect(jsFiles).toContain('index.js');
  expect(jsFiles.find((file) => file.includes('npm.react'))).toBeTruthy();
  expect(jsFiles.find((file) => file.includes('npm.react-dom'))).toBeTruthy();
  expect(jsFiles.find((file) => file.includes('npm.scheduler'))).toBeTruthy();
});
