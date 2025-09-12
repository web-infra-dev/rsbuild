import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should disable HTML generation for specific entries', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const outputs = rsbuild.getDistFiles();
  const outputFiles = Object.keys(outputs);

  expect(outputFiles.find((item) => item.includes('foo.html'))).toBeTruthy();
  expect(outputFiles.find((item) => item.includes('bar.html'))).toBeFalsy();

  await rsbuild.close();
});
