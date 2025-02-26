import { basename } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginReact } from '@rsbuild/plugin-react';

test('should generate vendor chunk when chunkSplit is "single-vendor"', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: [pluginReact()],
    rsbuildConfig: {
      output: {
        filenameHash: false,
      },
      performance: {
        chunkSplit: {
          strategy: 'single-vendor',
        },
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();

  const [vendorFile] = Object.entries(files).find(
    ([name, content]) => name.includes('vendor') && content.includes('React'),
  )!;
  expect(vendorFile).toBeTruthy();

  const jsFiles = Object.keys(files)
    .filter((name) => name.endsWith('.js'))
    .map((name) => basename(name));

  expect(jsFiles.length).toEqual(2);
  expect(jsFiles).toContain('index.js');
  expect(jsFiles).toContain('vendor.js');
});
