import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should support configuring an entry description object', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const outputs = rsbuild.getDistFiles();
  const outputFiles = Object.keys(outputs);

  expect(
    outputFiles.find((item) => item.includes('static/js/foo.')),
  ).toBeTruthy();
  expect(
    outputFiles.find((item) => item.includes('static/js/bar.')),
  ).toBeTruthy();

  await rsbuild.close();
});
