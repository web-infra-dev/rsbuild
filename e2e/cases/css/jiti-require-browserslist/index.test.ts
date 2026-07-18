import path from 'node:path';
import { expect, test } from '@e2e/helper';
import { getFileContent, readDirContents } from '@rstackjs/test-utils';

test('should normalize browserslist required by jiti config', async ({ execCliSync }) => {
  // Regression for CJS arrays loaded by require() in a jiti config.
  // https://github.com/web-infra-dev/rsbuild/issues/8063
  execCliSync('build --config-loader jiti');

  const files = await readDirContents(path.join(import.meta.dirname, 'dist'));
  const content = getFileContent(files, '.css');

  expect(content).toMatchSnapshot();
});
