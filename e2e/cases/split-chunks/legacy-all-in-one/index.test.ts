import { expect, test } from '@e2e/helper';
import { findFiles } from '@rstackjs/test-utils';

test('should output a single JavaScript bundle', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  // expect only one bundle (end with .js)
  const filePaths = findFiles(files, '.js');

  expect(filePaths.length).toBe(1);
});
