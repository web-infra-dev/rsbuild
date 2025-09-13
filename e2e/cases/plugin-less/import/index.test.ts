import { expect, test } from '@e2e/helper';

test('should compile less import correctly', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual('body{background-color:red}');
});
