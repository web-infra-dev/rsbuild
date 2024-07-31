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
    const files = await rsbuild.unwrapOutputJSON();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toContain(
      `@media (min-resolution: 2dppx) {
  .item {
    transition: all 0.5s;
    user-select: none;
    background: linear-gradient(to bottom, white, black);
  }
}`,
    );
  },
);
