import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

function isIncludeFile(filenames: string[], includeFilename: string) {
  return filenames.some((filename) => filename.includes(includeFilename));
}

test('should allow to configure additional assets', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filenames = Object.keys(files);

  const indexJs = await rsbuild.getIndexFile();
  expect(indexJs.content).toContain('data:application/json5;base64,');

  expect(
    isIncludeFile(filenames, 'dist/static/assets/test-temp-large.json5'),
  ).toBeTruthy();
  expect(
    isIncludeFile(filenames, 'dist/static/assets/test-temp-small.json5'),
  ).toBeFalsy();
});

test('should allow to disable emit for additional assets', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        emitAssets: false,
      },
    },
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filenames = Object.keys(files);

  expect(
    isIncludeFile(filenames, 'dist/static/assets/test-temp-large.json5'),
  ).toBeFalsy();
  expect(
    isIncludeFile(filenames, 'dist/static/assets/test-temp-small.json5'),
  ).toBeFalsy();
});
