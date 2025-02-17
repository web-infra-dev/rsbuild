import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('extends browserslist and downgrade the syntax', async () => {
  const originalCwd = process.cwd();
  process.chdir(import.meta.dirname);

  const rsbuild = await build({
    cwd: import.meta.dirname,
  });

  const files = await rsbuild.unwrapOutputJSON();

  const indexFile =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];

  expect(indexFile.includes('async ')).toBeFalsy();

  process.chdir(originalCwd);
});
