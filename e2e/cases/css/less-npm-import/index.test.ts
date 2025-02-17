import fs from 'node:fs';
import path from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compile less npm import correctly', async () => {
  fs.cpSync(
    path.resolve(import.meta.dirname, '_node_modules'),
    path.resolve(import.meta.dirname, 'node_modules'),
    { recursive: true },
  );

  const rsbuild = await build({
    cwd: import.meta.dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual('html{height:100%}body{color:red}');
});
