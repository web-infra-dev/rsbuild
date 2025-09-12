import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

function isIncludeFile(filenames: string[], includeFilename: string) {
  return filenames.some((filename) => filename.includes(includeFilename));
}

test('should disable asset emission for the node target', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  expect(isIncludeFile(filenames, 'dist/static/image/icon.png')).toBeTruthy();

  expect(
    isIncludeFile(filenames, 'dist/server/static/image/icon.png'),
  ).toBeFalsy();
});

test('should disable asset emission for JSON assets', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  expect(isIncludeFile(filenames, 'dist/static/assets/test.json')).toBeTruthy();

  expect(
    isIncludeFile(filenames, 'dist/server/static/assets/test.json'),
  ).toBeFalsy();
});
