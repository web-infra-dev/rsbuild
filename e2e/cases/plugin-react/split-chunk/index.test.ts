import { expect, test } from '@e2e/helper';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

test('should split react chunks correctly', async ({ build, buildOnly }) => {
  const rsbuild = await buildOnly({
    plugins: [pluginReact()],
  });

  const files = rsbuild.getDistFiles();
  const filesNames = Object.keys(files);
  expect(filesNames.find((file) => file.includes('lib-react'))).toBeTruthy();
  expect(filesNames.find((file) => file.includes('lib-router'))).toBeTruthy();
});

test('should not split react chunks when strategy is `all-in-one`', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    plugins: [pluginReact()],
    rsbuildConfig: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const filesNames = Object.keys(files);
  expect(filesNames.find((file) => file.includes('lib-react'))).toBeFalsy();
  expect(filesNames.find((file) => file.includes('lib-router'))).toBeFalsy();
});

test('should not override user defined cache groups', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    plugins: [pluginReact()],
    rsbuildConfig: {
      performance: {
        chunkSplit: {
          override: {
            cacheGroups: {
              react: {
                name: 'my-react',
                test: /react/,
              },
            },
          },
        },
      },
    },
  });

  const files = rsbuild.getDistFiles();
  const filesNames = Object.keys(files);
  expect(filesNames.find((file) => file.includes('my-react'))).toBeTruthy();
});
