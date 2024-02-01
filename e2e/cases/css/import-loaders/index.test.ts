import { expect } from '@playwright/test';
import { build } from '@e2e/helper';
import { webpackOnlyTest } from '@e2e/helper';

webpackOnlyTest(
  'should compile CSS modules which depends on importLoaders correctly',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
    });
    const files = await rsbuild.unwrapOutputJSON();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toEqual(
      '.class-foo-yQ8Tl7+.hello-class-foo{background-color:red}.class-bar-TVH2T6 .hello-class-bar{background-color:blue}',
    );
  },
);
