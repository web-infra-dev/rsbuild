import { expect, getFileContent, rspackTest } from '@e2e/helper';

rspackTest(
  'should compile CSS relative imports correctly',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();

    const content = getFileContent(files, '.css');

    expect(content).toContain(
      '.foo{color:red}.bar{color:#00f}.baz{color:green}',
    );
  },
);
