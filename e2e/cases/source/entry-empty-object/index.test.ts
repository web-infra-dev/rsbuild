import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should set default entry when entry is set to an empty object', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = rsbuild.getDistFiles();
  const filenames = Object.keys(files);

  expect(
    filenames.find((item) => item.includes('static/js/index.')),
  ).toBeTruthy();

  await rsbuild.close();
});
