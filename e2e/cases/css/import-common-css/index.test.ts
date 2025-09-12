import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should compile common CSS import correctly',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly({
      rsbuildConfig: {
        resolve: {
          alias: {
            '@': './src',
          },
        },
      },
    });

    const files = rsbuild.getDistFiles();
    const cssFiles = Object.keys(files).find((file) => file.endsWith('.css'))!;

    expect(files[cssFiles]).toEqual(
      'html{min-height:100%}#a{color:red}#b{color:#00f}',
    );
  },
);
