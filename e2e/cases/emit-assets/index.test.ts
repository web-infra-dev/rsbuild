import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to disable emit assets for node target', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const filenames = Object.keys(files);

  expect(
    filenames.some((filename) =>
      filename.includes('dist/static/image/icon.png'),
    ),
  ).toBeTruthy();

  expect(
    filenames.some((filename) =>
      filename.includes('dist/server/static/image/icon.png'),
    ),
  ).toBeFalsy();
});
