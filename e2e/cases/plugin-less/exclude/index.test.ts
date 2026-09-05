import { expect, test } from '@e2e/helper';
import { findFiles } from '@rstackjs/test-utils';

test('should exclude specified Less files using the exclude option', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const cssFiles = findFiles(files, '.css');
  const lessFiles = findFiles(files, '.less');

  expect(lessFiles.length).toBe(1);
  expect(cssFiles.length).toBe(1);
});
