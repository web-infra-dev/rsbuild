import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

function isIncludeFile(filenames: string[], includeFilename: string) {
  return filenames.some((filename) => filename.includes(includeFilename));
}

test('should allow to disable emit assets for node target', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filenames = Object.keys(files);

  expect(isIncludeFile(filenames, 'dist/static/image/icon.png')).toBeTruthy();

  expect(
    isIncludeFile(filenames, 'dist/server/static/image/icon.png'),
  ).toBeFalsy();
});

test('should allow to disable emit assets for json assets', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filenames = Object.keys(files);

  expect(isIncludeFile(filenames, 'dist/static/assets/test.json')).toBeTruthy();

  expect(
    isIncludeFile(filenames, 'dist/server/static/assets/test.json'),
  ).toBeFalsy();
});
