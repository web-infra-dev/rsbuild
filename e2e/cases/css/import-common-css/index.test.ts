import { expect, getFileContent, rspackTest } from '@e2e/helper';

rspackTest('should compile common CSS import correctly', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();
  const indexCss = getFileContent(files, 'index.css');
  expect(indexCss).toEqual('html{min-height:100%}#a{color:red}#b{color:#00f}');
});
