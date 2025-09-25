import { expect, getFileContent, rspackTest } from '@e2e/helper';

rspackTest('should compile stylus correctly', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const content = getFileContent(files, '.css');

  expect(content).toMatch(
    /body{color:red;font:14px Arial,sans-serif}\.title-class-\w{6}{font-size:14px}/,
  );
});
