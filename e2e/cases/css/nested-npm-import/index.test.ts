import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { fse } from '@rsbuild/shared';

test('should compile nested npm import correctly', async () => {
  fse.copySync(
    path.resolve(__dirname, '_node_modules'),
    path.resolve(__dirname, 'node_modules'),
  );

  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual(
    '#b{color:yellow}#c{color:green}#a{font-size:10px}html{font-size:18px}',
  );
});
