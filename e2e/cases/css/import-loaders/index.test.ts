import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should compile CSS Modules which depends on importLoaders correctly',
  async ({ build }) => {
    const rsbuild = await build();
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toEqual(
      '.class-foo-yQ8Tl7+.hello-class-foo{background-color:red}.class-bar-TVH2T6 .hello-class-bar{background-color:#00f}',
    );
  },
);
