import { expect, getFileContent, test } from '@e2e/helper';

test('should retain Moment locales when removeMomentLocale is false (default)', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      output: {
        sourceMap: {
          js: 'source-map',
        },
      },
      performance: {
        chunkSplit: {
          strategy: 'custom',
          splitChunks: {
            cacheGroups: {
              react: {
                test: /moment/,
                name: 'moment-js',
                chunks: 'all',
              },
            },
          },
        },
      },
    },
    runServer: false,
  });

  const files = rsbuild.getDistFiles({ sourceMaps: true });

  const momentMapFile = getFileContent(files, 'moment-js.js.map');

  expect(momentMapFile.includes('moment/locale')).toBeTruthy();
});

test('should remove Moment locales when removeMomentLocale is true', async ({
  build,
}) => {
  const rsbuild = await build({
    config: {
      output: {
        sourceMap: {
          js: 'source-map',
        },
      },
      performance: {
        removeMomentLocale: true,
        chunkSplit: {
          strategy: 'custom',
          splitChunks: {
            cacheGroups: {
              react: {
                test: /moment/,
                name: 'moment-js',
                chunks: 'all',
              },
            },
          },
        },
      },
    },
    runServer: false,
  });

  const files = rsbuild.getDistFiles({ sourceMaps: true });

  const momentMapFile = getFileContent(files, 'moment-js.js.map');

  expect(momentMapFile.includes('moment/locale')).toBeFalsy();
});
