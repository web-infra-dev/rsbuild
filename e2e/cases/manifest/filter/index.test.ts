import { expect, test } from '@e2e/helper';
import type { ManifestData } from '@rsbuild/core';
import { getFileContent } from '@rstackjs/test-utils';

test('should allow to filter files in manifest', async ({ build }) => {
  const rsbuild = await build({
    config: {
      output: {
        manifest: {
          filter: (file) => file.name.endsWith('.js'),
        },
        filenameHash: false,
      },
      splitChunks: false,
    },
  });

  const files = rsbuild.getDistFiles();

  const manifestContent = getFileContent(files, 'manifest.json');
  const manifest = JSON.parse(manifestContent) as ManifestData;

  // index.js
  expect(manifest.allFiles).toHaveLength(1);

  expect(manifest.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
  });
});

test('should allow to include license files in manifest', async ({ build }) => {
  const rsbuild = await build({
    config: {
      output: {
        manifest: {
          filter: () => true,
        },
        filenameHash: false,
      },
      splitChunks: false,
    },
  });

  const files = rsbuild.getDistFiles();

  const manifestContent = getFileContent(files, 'manifest.json');
  const manifest = JSON.parse(manifestContent) as ManifestData;

  expect(manifest.allFiles).toHaveLength(3);

  expect(manifest.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
    html: ['/index.html'],
    assets: ['/static/js/index.js.LICENSE.txt'],
  });
});
