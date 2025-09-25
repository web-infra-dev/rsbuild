import { expect, getFileContent, rspackTest } from '@e2e/helper';

rspackTest(
  'should resolve ts paths correctly in SCSS file',
  async ({ build }) => {
    const rsbuild = await build();

    const files = rsbuild.getDistFiles();

    const content = getFileContent(files, '.css');

    expect(content).toContain('background-image:url(/static/image/icon');
  },
);
