import { expect, rspackTest } from '@e2e/helper';

rspackTest('should minimize CSS correctly by default', async ({ build }) => {
  const rsbuild = await build();
  const files = rsbuild.getDistFiles();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toEqual(
    '.a{text-align:center;text-align:center;font-size:1.5rem;line-height:1.5}.b{text-align:center;background:#fafafa;font-size:1.5rem;line-height:1.5}',
  );
});
