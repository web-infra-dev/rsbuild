import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { RsbuildConfig } from '@rsbuild/core';

const fixtures = __dirname;

const rsbuildConfig: RsbuildConfig = {
  output: {
    manifest: {
      filename: 'my-manifest.json',
      generate: ({ files, manifestData }) => {
        return {
          filesCount: files.length,
          data: manifestData,
        };
      },
    },
    sourceMap: false,
    filenameHash: false,
  },
  performance: {
    chunkSplit: {
      strategy: 'all-in-one',
    },
  },
};

test('should generate custom manifest data in production build', async () => {
  const rsbuild = await build({
    cwd: fixtures,
    rsbuildConfig,
  });

  const files = rsbuild.getDistFiles();
  const manifestContent =
    files[
      Object.keys(files).find((file) => file.endsWith('my-manifest.json'))!
    ];
  const manifest = JSON.parse(manifestContent);

  expect(manifest.filesCount).toBe(2);
  expect(manifest.data.allFiles.length).toBe(2);
  expect(manifest.data.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
    html: ['/index.html'],
  });
});

test('should generate custom manifest data in dev', async ({ page }) => {
  const rsbuild = await dev({
    cwd: fixtures,
    page,
    rsbuildConfig,
  });

  const files = rsbuild.getDistFiles();
  const manifestContent =
    files[
      Object.keys(files).find((file) => file.endsWith('my-manifest.json'))!
    ];
  const manifest = JSON.parse(manifestContent);

  expect(manifest.filesCount).toBe(2);
  expect(manifest.data.allFiles.length).toBe(2);
  expect(manifest.data.entries.index).toMatchObject({
    initial: {
      js: ['/static/js/index.js'],
    },
    html: ['/index.html'],
  });

  await rsbuild.close();
});
