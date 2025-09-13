import { expect, test } from '@e2e/helper';

test('should extend browserslist and downgrade syntax', async ({ build }) => {
  const originalCwd = process.cwd();
  process.chdir(__dirname);

  const rsbuild = await build();

  const files = rsbuild.getDistFiles();

  const indexFile =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];

  expect(indexFile.includes('async ')).toBeFalsy();

  process.chdir(originalCwd);
});
