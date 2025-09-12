import { expect, test } from '@e2e/helper';

test('should allow plugin to transform code by environments', async ({
  buildOnly,
}) => {
  const rsbuild = await buildOnly();

  const files = rsbuild.getDistFiles();
  const webJs = Object.keys(files).find(
    (file) =>
      file.includes('index') &&
      !file.includes('server') &&
      file.endsWith('.js'),
  );
  const nodeJs = Object.keys(files).find(
    (file) =>
      file.includes('index') && file.includes('server') && file.endsWith('.js'),
  );

  expect(files[webJs!].includes('environments is web')).toBeTruthy();
  expect(files[nodeJs!].includes('environments is node')).toBeTruthy();
});
