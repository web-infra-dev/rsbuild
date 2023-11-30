import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

test('should compile less inline js correctly', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual('body{width:200}');
});
