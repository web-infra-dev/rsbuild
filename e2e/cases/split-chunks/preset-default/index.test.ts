import { basename } from 'node:path';
import { expect, test } from '@e2e/helper';
import { findFiles } from '@rstackjs/test-utils';

test('should apply default preset as expected', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const jsFiles = findFiles(files, '.js').map((name) => basename(name));
  expect(jsFiles.sort()).toEqual([
    'index.js',
    'lib-polyfill.js',
    'lib-react.js',
  ]);
});
