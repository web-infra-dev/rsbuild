import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

test('output.manifest set a path', async () => {
  await build({
    cwd: fixtures,
    rsbuildConfig: {
      output: {
        manifest: './custom/my-manifest.json',
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

  const manifest = join(__dirname, 'dist', 'custom/my-manifest.json');
  const manifestContent = readFileSync(manifest, 'utf-8');
  expect(manifestContent).toBeDefined();

  const parsed = JSON.parse(manifestContent);

  // main.js、index.html
  expect(Object.keys(parsed.allFiles).length).toBe(2);
});

test('output.manifest when target is node', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    rsbuildConfig: {
      output: {
        distPath: {
          root: 'dist-1',
        },
        target: 'node',
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
