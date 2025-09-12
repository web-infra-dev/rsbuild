import { expect, test } from '@e2e/helper';

test('should allow to custom HTML filename', async ({ build, buildOnly }) => {
  const rsbuild = await buildOnly();

  const files = rsbuild.getDistFiles();
  const fooFile = Object.keys(files).find((item) =>
    item.includes('custom-foo.html'),
  );
  const barFile = Object.keys(files).find((item) =>
    item.includes('custom-bar.html'),
  );
  expect(fooFile).toBeTruthy();
  expect(barFile).toBeTruthy();
});
