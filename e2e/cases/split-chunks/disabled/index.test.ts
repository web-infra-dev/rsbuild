import { expect, test } from '@e2e/helper';
import { findFiles } from '@rstackjs/test-utils';

test('should not split chunks if `splitChunks` is disabled', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const jsFiles = findFiles(files, '.js');
  expect(jsFiles.length).toEqual(1);
});
