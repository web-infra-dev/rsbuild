import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should read browserslist array from package.json', async () => {
  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.getDistFiles();

  const indexFile =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];

  expect(indexFile.includes('async ')).toBeFalsy();
});
