import { expect, test } from '@e2e/helper';

test('should compile less inline js correctly', async ({ buildOnly }) => {
  const rsbuild = await buildOnly();
  const files = rsbuild.getDistFiles();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual('body{opacity:.2}');
});
