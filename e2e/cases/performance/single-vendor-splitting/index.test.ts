import { basename } from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should support `forceSplitting` when chunkSplit is "single-vendor"', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.getDistFiles();

  const jsFiles = Object.keys(files)
    .filter((name) => name.endsWith('.js'))
    .map((name) => basename(name));

  expect(jsFiles.length).toEqual(3);
  expect(jsFiles).toContain('index.js');
  expect(jsFiles).toContain('vendor.js');
  expect(jsFiles).toContain('my-react.js');
});
