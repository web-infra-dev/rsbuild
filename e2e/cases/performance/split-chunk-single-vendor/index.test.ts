import { basename } from 'node:path';
import { expect, test } from '@e2e/helper';

test('should generate vendor chunk when chunkSplit is "single-vendor"', async ({
  build,
}) => {
  const rsbuild = await build({});

  const files = rsbuild.getDistFiles();

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
