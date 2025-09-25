import { expect, getFileContent, test } from '@e2e/helper';

test('should allow plugin to transform code by targets', async ({ build }) => {
  const rsbuild = await build();

  const files = rsbuild.getDistFiles();
  const webJs = getFileContent(
    files,
    (file) =>
      file.includes('index') &&
      !file.includes('server') &&
      file.endsWith('.js'),
  );
  const nodeJs = getFileContent(
    files,
    (file) =>
      file.includes('index') && file.includes('server') && file.endsWith('.js'),
  );

  expect(webJs.includes('target is web')).toBeTruthy();
  expect(nodeJs.includes('target is node')).toBeTruthy();
});
