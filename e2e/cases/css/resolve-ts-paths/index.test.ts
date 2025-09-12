import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should resolve ts paths correctly in SCSS file',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly();

    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toContain('background-image:url(/static/image/icon');
  },
);
