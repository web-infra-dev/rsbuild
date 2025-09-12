import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow plugin to transform code by environments', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

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
