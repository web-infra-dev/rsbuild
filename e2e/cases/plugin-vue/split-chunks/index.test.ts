import { expect, test } from '@e2e/helper';
import { pluginVue } from '@rsbuild/plugin-vue';

test('should split vue chunks correctly', async ({ build }) => {
  const rsbuild = await build({
    plugins: [pluginVue()],
  });

  const files = rsbuild.getDistFiles();
  const filesNames = Object.keys(files);
  expect(filesNames.find((file) => file.includes('lib-vue'))).toBeTruthy();
  expect(filesNames.find((file) => file.includes('lib-router'))).toBeTruthy();
});

test('should not split vue chunks when strategy is `all-in-one`', async ({
  build,
}) => {
  const rsbuild = await build({
    plugins: [pluginVue()],
    config: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const filesNames = Object.keys(files);
  expect(filesNames.find((file) => file.includes('lib-vue'))).toBeFalsy();
  expect(filesNames.find((file) => file.includes('lib-router'))).toBeFalsy();
});

test('should not override user defined cache groups', async ({ build }) => {
  const rsbuild = await build({
    plugins: [pluginVue()],
    config: {
      performance: {
        chunkSplit: {
          override: {
            cacheGroups: {
              vue: {
                name: 'my-vue',
                test: /vue/,
              },
            },
          },
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const filesNames = Object.keys(files);
  expect(filesNames.find((file) => file.includes('my-vue'))).toBeTruthy();
});
