import { expect, test } from '@e2e/helper';

test('should read browserslist string from package.json', async ({ build }) => {
  const rsbuild = await build();

  const files = rsbuild.getDistFiles();

  const indexFile =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];

  expect(indexFile.includes('async ')).toBeFalsy();
});
