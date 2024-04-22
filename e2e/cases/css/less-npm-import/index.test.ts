import path from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { fse } from '@rsbuild/shared';

test('should compile less npm import correctly', async () => {
  fse.copySync(
    path.resolve(__dirname, '_node_modules'),
    path.resolve(__dirname, 'node_modules'),
  );

  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual('html{height:100%}body{color:red}');
});
