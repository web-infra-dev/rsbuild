import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should support configuring an entry description object', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  expect(
    filenames.find((item) => item.includes('static/js/foo.')),
  ).toBeTruthy();
  expect(
    filenames.find((item) => item.includes('static/js/bar.')),
  ).toBeTruthy();

  await rsbuild.close();
});
