import { join } from 'path';
import { expect } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginReact } from '@rsbuild/plugin-react';
import { webpackOnlyTest } from '@scripts/helper';

const fixtures = __dirname;

// TODO: https://github.com/web-infra-dev/rspack/issues/4395
webpackOnlyTest('enableAssetManifest', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    entry: {
      main: join(fixtures, 'src/index.jsx'),
    },
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        enableAssetManifest: true,
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

  rsbuild.close();
});
