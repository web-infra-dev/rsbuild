import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should compile CSS Modules with named exports correctly',
  async ({ page, build }) => {
    const rsbuild = await build({
      rsbuildConfig: {
        output: {
          cssModules: {
            namedExport: true,
          },
        },
      },
    });
    const files = rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toMatch(
      /\.classA-\w{6}{color:red}\.classB-\w{6}{color:#00f}\.classC-\w{6}{color:#ff0}/,
    );

    const root = page.locator('#root');
    const text = await root.innerHTML();

    expect(text).toMatch(/classA-\w{6} classB-\w{6} classC-\w{6}/);
  },
);
