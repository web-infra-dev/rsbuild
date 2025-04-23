import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to custom dist path of different files', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  // JS
  expect(
    filenames.some((filename) =>
      filename.includes('dist/custom/my-js/index.js'),
    ),
  ).toBeTruthy();
  expect(
    filenames.some((filename) =>
      filename.includes('dist/custom/my-async-js/foo.js'),
    ),
  ).toBeTruthy();

  // CSS
  expect(
    filenames.some((filename) =>
      filename.includes('dist/custom/my-css/index.css'),
    ),
  ).toBeTruthy();
  expect(
    filenames.some((filename) =>
      filename.includes('dist/custom/my-async-css/foo.css'),
    ),
  ).toBeTruthy();

  // HTML
  expect(
    filenames.some((filename) =>
      filename.includes('dist/custom/my-html/index.html'),
    ),
  ).toBeTruthy();

  // Image
  expect(
    filenames.some((filename) =>
      filename.includes('dist/custom/my-image/icon.png'),
    ),
  ).toBeTruthy();
});
