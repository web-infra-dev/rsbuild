import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should build CSS assets correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const outputs = rsbuild.getDistFiles();
  const outputFiles = Object.keys(outputs);

  expect(
    outputFiles.find(
      (item) => item.includes('static/image/image') && item.endsWith('.jpeg'),
    ),
  ).toBeTruthy();

  await rsbuild.close();
});
