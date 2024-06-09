import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to custom filename by function', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
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
});
