import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should extend browserslist and downgrade syntax', async () => {
  const originalCwd = process.cwd();
  process.chdir(__dirname);

  const rsbuild = await build({
    cwd: __dirname,
  });

  const files = await rsbuild.getDistFiles();

  const indexFile =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];

  expect(indexFile.includes('async ')).toBeFalsy();

  process.chdir(originalCwd);
});
