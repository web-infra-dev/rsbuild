import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('removeMomentLocale false (default)', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
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

  const files = await rsbuild.unwrapOutputJSON(false);

  const fileName = Object.keys(files).find(
    (file) => file.includes('moment-js') && file.endsWith('.js.map'),
  );

  const momentMapFile = files[fileName!];

  expect(momentMapFile.includes('moment/locale')).toBeTruthy();
});

test('removeMomentLocale true', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
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

  const files = await rsbuild.unwrapOutputJSON(false);

  const fileName = Object.keys(files).find(
    (file) => file.includes('moment-js') && file.endsWith('.js.map'),
  );

  const momentMapFile = files[fileName!];

  expect(momentMapFile.includes('moment/locale')).toBeFalsy();
});
