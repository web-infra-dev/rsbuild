import { test, expect } from '@playwright/test';
import { build } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test('should split react chunks correctly', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filesNames = Object.keys(files);
  expect(filesNames.find((file) => file.includes('lib-react'))).toBeTruthy();
  expect(filesNames.find((file) => file.includes('lib-router'))).toBeTruthy();
});

test('should not split react chunks when strategy is `all-in-one`', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginReact()],
    rsbuildConfig: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filesNames = Object.keys(files);
  expect(filesNames.find((file) => file.includes('lib-react'))).toBeFalsy();
  expect(filesNames.find((file) => file.includes('lib-router'))).toBeFalsy();
});
