import fs from 'node:fs';
import path from 'node:path';

import { expect, getFileContent, test } from '@e2e/helper';

test('should compile less npm import correctly', async ({ build }) => {
  fs.cpSync(
    path.resolve(import.meta.dirname, '_node_modules'),
    path.resolve(import.meta.dirname, 'node_modules'),
    { recursive: true },
  );

  const rsbuild = await build();

  const files = rsbuild.getDistFiles();
  const cssContent = getFileContent(files, '.css');

  expect(cssContent).toEqual('html{height:100%}body{color:red}');
});
