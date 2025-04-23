import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow to disable the built-in lightningcss loader',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
      rsbuildConfig: {
        tools: {
          lightningcssLoader: false,
        },
        output: {
          minify: false,
        },
      },
    });
    const files = await rsbuild.getDistFiles();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).not.toContain('-webkit-');
    expect(content).not.toContain('-ms-');
  },
);
