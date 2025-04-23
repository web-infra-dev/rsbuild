import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow filename.image: "[path]"', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });
  const files = await rsbuild.getDistFiles();
  const filenames = Object.keys(files);
  // Image
  expect(
    filenames.some((filename) => filename.includes('dist/src/assets/icon.png')),
  ).toBeTruthy();
});
