import { join } from 'path';
import { test, expect } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';

const fixtures = __dirname;

// TODO run test in uniBuilder
test.skip('enableAssetManifest', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.jsx'),
    },
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        // enableAssetManifest: true,
        legalComments: 'none',
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
    files[
      Object.keys(files).find((file) => file.endsWith('asset-manifest.json'))!
    ];

  expect(manifestContent).toBeDefined();

  const manifest = JSON.parse(manifestContent);

  // main.js、index.html、main.js.map
  expect(Object.keys(manifest.files).length).toBe(3);
  expect(manifest.entrypoints.length).toBe(1);

  await rsbuild.close();
});
