import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to custom HTML filename', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = rsbuild.getDistFiles();
  const fooFile = Object.keys(files).find((item) =>
    item.includes('custom-foo.html'),
  );
  const barFile = Object.keys(files).find((item) =>
    item.includes('custom-bar.html'),
  );
  expect(fooFile).toBeTruthy();
  expect(barFile).toBeTruthy();
  await rsbuild.close();
});
