import { expect, getFileContent, rspackTest } from '@e2e/helper';

rspackTest('should compile CSS with alias correctly', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const content = getFileContent(files, '.css');

  expect(content).toMatch(
    /\.the-a-class{color:red;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}\.the-b-class{color:#00f;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}\.the-c-class{color:#ff0;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}/,
  );
});
