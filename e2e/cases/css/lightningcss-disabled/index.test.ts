import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to disable the built-in lightningcss loader',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly({
      rsbuildConfig: {
        tools: {
          lightningcssLoader: false,
        },
        output: {
          minify: false,
        },
      },
    });
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).not.toContain('-webkit-');
    expect(content).not.toContain('-ms-');
  },
);
