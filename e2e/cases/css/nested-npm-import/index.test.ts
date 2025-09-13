import fs from 'node:fs';
import path from 'node:path';
import { expect, rspackTest } from '@e2e/helper';

rspackTest('should compile nested npm import correctly', async ({ build }) => {
  fs.cpSync(
    path.resolve(__dirname, '_node_modules'),
    path.resolve(__dirname, 'node_modules'),
    { recursive: true },
  );

  const rsbuild = await build();

  const files = rsbuild.getDistFiles();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual(
    '#b{color:#ff0}#c{color:green}#a{font-size:10px}html{font-size:18px}',
  );
});
