import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow plugin to transform code by targets', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.getDistFiles();
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

  expect(files[webJs!].includes('target is web')).toBeTruthy();
  expect(files[nodeJs!].includes('target is node')).toBeTruthy();
});
