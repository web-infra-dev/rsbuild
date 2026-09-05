import { basename } from 'node:path';

import { expect, test } from '@e2e/helper';
import { findFiles } from '@rstackjs/test-utils';

test('should support `forceSplitting` when chunkSplit is "single-vendor"', async ({
  build,
}) => {
  const rsbuild = await build();

  const files = rsbuild.getDistFiles();

  const jsFiles = findFiles(files, '.js').map((name) => basename(name));

  expect(jsFiles.length).toEqual(3);
  expect(jsFiles).toContain('index.js');
  expect(jsFiles).toContain('vendor.js');
  expect(jsFiles).toContain('my-react.js');
});
