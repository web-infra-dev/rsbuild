import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should compile CSS with alias correctly',
  async ({ build, buildOnly }) => {
    const rsbuild = await buildOnly();
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toMatch(
      /\.the-a-class{color:red;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}\.the-b-class{color:#00f;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}\.the-c-class{color:#ff0;background-image:url\(\/static\/image\/icon\.\w{8}\.png\)}/,
    );
  },
);
