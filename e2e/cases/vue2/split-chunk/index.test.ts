import { test, expect } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginVue2 } from '@rsbuild/plugin-vue2';

const fixtures = __dirname;

test('should split vue chunks correctly', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginVue2()],
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filesNames = Object.keys(files);
  expect(filesNames.find((file) => file.includes('lib-vue'))).toBeTruthy();
});

test('should not split vue chunks when strategy is `all-in-one`', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    plugins: [pluginVue2()],
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
});
