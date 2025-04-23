import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to custom filename by function', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  // JS
  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/js/my-index.js'),
    ),
  ).toBeTruthy();
  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/js/async/some-path/foo.js'),
    ),
  ).toBeTruthy();

  // CSS
  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/css/my-index.css'),
    ),
  ).toBeTruthy();
  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/css/async/some-path/foo.css'),
    ),
  ).toBeTruthy();

  // Image
  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/image/my-icon.png'),
    ),
  ).toBeTruthy();
  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/image/some-path/image.png'),
    ),
  ).toBeTruthy();

  // SVG
  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/svg/my-circle.svg'),
    ),
  ).toBeTruthy();
  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/svg/some-path/mobile.svg'),
    ),
  ).toBeTruthy();
});
