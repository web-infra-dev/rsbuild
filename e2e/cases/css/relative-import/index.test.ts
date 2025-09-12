import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should compile CSS relative imports correctly',
  async ({ build, buildOnly }) => {
    const rsbuild = await buildOnly();
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toContain(
      '.foo{color:red}.bar{color:#00f}.baz{color:green}',
    );
  },
);
