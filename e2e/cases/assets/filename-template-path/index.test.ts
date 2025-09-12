import { expect, test } from '@e2e/helper';

test('should allow filename.image: "[path]"', async ({ buildOnly }) => {
  const rsbuild = await buildOnly();
  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);
  // Image
  expect(
    filenames.some((filename) => filename.includes('dist/src/assets/icon.png')),
  ).toBeTruthy();
});
