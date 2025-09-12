import { expect, test } from '@e2e/helper';

test('should output a single JavaScript bundle', async ({ buildOnly }) => {
  const rsbuild = await buildOnly();
  const files = rsbuild.getDistFiles();
  // expect only one bundle (end with .js)
  const filePaths = Object.keys(files).filter((file) => file.endsWith('.js'));

  expect(filePaths.length).toBe(1);
});
