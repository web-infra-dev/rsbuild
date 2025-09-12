import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to custom CSS minify options',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly({
      rsbuildConfig: {},
    });
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toEqual('.bar{color:green}');
  },
);
