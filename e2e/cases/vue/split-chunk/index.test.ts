import { test, expect } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginVue } from '@rsbuild/plugin-vue';

const fixtures = __dirname;

test('should split vue chunks correctly', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginVue()],
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filesNames = Object.keys(files);
  expect(filesNames.find((file) => file.includes('lib-vue'))).toBeTruthy();
  expect(filesNames.find((file) => file.includes('lib-router'))).toBeTruthy();
});

test('should not split vue chunks when strategy is `all-in-one`', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginVue()],
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
  expect(filesNames.find((file) => file.includes('lib-vue'))).toBeFalsy();
  expect(filesNames.find((file) => file.includes('lib-router'))).toBeFalsy();
});
