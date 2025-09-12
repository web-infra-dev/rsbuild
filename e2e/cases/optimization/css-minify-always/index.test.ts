import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should minimize CSS correctly by default',
  async ({ build, buildOnly }) => {
    const rsbuild = await buildOnly({
      rsbuildConfig: {},
    });
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toEqual(
      '.a{text-align:center;text-align:center;font-size:1.5rem;line-height:1.5}.b{text-align:center;background:#fafafa;font-size:1.5rem;line-height:1.5}',
    );
  },
);
