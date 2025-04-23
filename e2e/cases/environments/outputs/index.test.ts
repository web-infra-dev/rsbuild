import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should apply multiple dist path correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      environments: {
        web: {
          output: {
            filenameHash: false,
          },
        },
        web1: {
          output: {
            filenameHash: false,
            distPath: {
              root: 'dist/web1',
            },
          },
        },
      },
    },
  });

  const files = await rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  expect(
    filenames.some((filename) => filename.includes('dist/static/js/index.js')),
  ).toBeTruthy();
  expect(
    filenames.some((filename) =>
      filename.includes('dist/web1/static/js/index.js'),
    ),
  ).toBeTruthy();
});
