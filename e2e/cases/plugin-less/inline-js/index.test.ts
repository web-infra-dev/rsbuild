import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compile less inline js correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = rsbuild.getDistFiles();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual('body{opacity:.2}');
});
