import { expect, test } from '@e2e/helper';
import { findFiles } from '@rstackjs/test-utils';

test('should allow to disable the default `lib-polyfill` cache group', async ({
  build,
}) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const jsFiles = findFiles(files, '.js');
  expect(jsFiles.find((file) => file.includes('lib-polyfill'))).toBeFalsy();
});
