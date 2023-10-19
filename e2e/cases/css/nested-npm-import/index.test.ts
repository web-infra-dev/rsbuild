import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { fs } from '@rsbuild/shared/fs-extra';

test('should compile nested npm import correctly', async () => {
  fs.copySync(
    path.resolve(__dirname, '_node_modules'),
    path.resolve(__dirname, 'node_modules'),
  );

  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  });

  const files = await builder.unwrapOutputJSON();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual(
    '#b{color:#ff0}#c{color:green}#a{font-size:10px}html{font-size:18px}',
  );
});
