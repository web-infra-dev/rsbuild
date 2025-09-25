import { expect, getFileContent, rspackTest } from '@e2e/helper';

rspackTest('should allow to minify CSS in dev', async ({ dev }) => {
  const rsbuild = await dev();
  const files = rsbuild.getDistFiles();

  const content = getFileContent(files, '.css');

  expect(content).toEqual(
    '.a{text-align:center;text-align:center;font-size:1.5rem;line-height:1.5}.b{text-align:center;background:#fafafa;font-size:1.5rem;line-height:1.5}',
  );
});
