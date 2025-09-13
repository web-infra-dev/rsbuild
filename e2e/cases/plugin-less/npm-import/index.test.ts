import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@e2e/helper';

test('should compile less npm import correctly', async ({ build }) => {
  fs.cpSync(
    path.resolve(__dirname, '_node_modules'),
    path.resolve(__dirname, 'node_modules'),
    { recursive: true },
  );

  const rsbuild = await build();

  const files = rsbuild.getDistFiles();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual('html{height:100%}body{color:red}');
});
