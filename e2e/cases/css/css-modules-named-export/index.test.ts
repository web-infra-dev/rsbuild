import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should compile CSS Modules with named exports correctly',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
      rsbuildConfig: {
        output: {
          cssModules: {
            namedExport: true,
          },
        },
      },
    });
    const files = await rsbuild.unwrapOutputJSON();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toMatch(
      /\.classA-\w{6}{color:red}\.classB-\w{6}{color:#00f}\.classC-\w{6}{color:#ff0}/,
    );

    const root = page.locator('#root');
    const text = await root.innerHTML();

    expect(text).toMatch(/classA-\w{6} classB-\w{6} classC-\w{6}/);
    await rsbuild.close();
  },
);
