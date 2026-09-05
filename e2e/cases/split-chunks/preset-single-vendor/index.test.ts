import { basename } from 'node:path';
import { expect, test } from '@e2e/helper';
import { findFile, findFiles } from '@rstackjs/test-utils';

test('should generate a vendor chunk when preset is "single-vendor"', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const vendorFile = findFile(
    files,
    (name) => name.includes('vendor') && files[name].includes('React'),
  );
  expect(vendorFile).toBeTruthy();

  const jsFiles = findFiles(files, '.js').map((name) => basename(name));

  expect(jsFiles.length).toEqual(2);
  expect(jsFiles).toContain('index.js');
  expect(jsFiles).toContain('vendor.js');
});
