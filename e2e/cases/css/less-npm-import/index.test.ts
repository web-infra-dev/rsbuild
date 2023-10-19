import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { fs } from '@rsbuild/shared/fs-extra';

test('should compile less npm import correctly', async () => {
  fs.copySync(
    path.resolve(__dirname, '_node_modules'),
    path.resolve(__dirname, 'node_modules'),
  );

  const rsbuild = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  });

  const files = await rsbuild.unwrapOutputJSON();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual('html{height:100%}body{color:red}');
});
