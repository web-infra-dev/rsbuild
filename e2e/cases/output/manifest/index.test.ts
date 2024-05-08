import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const fixtures = __dirname;

test('output.manifest', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    rsbuildConfig: {
      output: {
        manifest: true,
        legalComments: 'none',
        filenameHash: false,
      },
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const manifestContent =
    files[Object.keys(files).find((file) => file.endsWith('manifest.json'))!];

  expect(manifestContent).toBeDefined();

  const manifest = JSON.parse(manifestContent);

  // main.js、index.html
  expect(Object.keys(manifest.allFiles).length).toBe(2);

  expect(manifest.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
    html: ['/index.html'],
  });
});

test('output.manifest when target is node', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-1',
        },
        targets: ['node'],
        manifest: true,
        legalComments: 'none',
        filenameHash: false,
      },
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const manifestContent =
    files[Object.keys(files).find((file) => file.endsWith('manifest.json'))!];

  expect(manifestContent).toBeDefined();

  const manifest = JSON.parse(manifestContent);

  // main.js、index.html
  expect(Object.keys(manifest.allFiles).length).toBe(1);

  expect(manifest.entries.index).toMatchObject({
    initial: {
      js: ['/index.js'],
    },
  });
});
