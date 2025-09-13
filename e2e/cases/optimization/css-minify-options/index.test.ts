import { expect, rspackTest } from '@e2e/helper';

rspackTest('should allow to custom CSS minify options', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toEqual('.bar{color:green}');
});
