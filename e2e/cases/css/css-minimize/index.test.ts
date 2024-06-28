import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { pluginCssMinimizer } from '@rsbuild/plugin-css-minimizer';

rspackOnlyTest('should minimize CSS correctly by default', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {},
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.css'))!];

  expect(content).toEqual(
    '.a{text-align:center;text-align:center;font-size:1.5rem;line-height:1.5}.b{text-align:center;background:#fafafa;font-size:1.5rem;line-height:1.5}',
  );
});

rspackOnlyTest(
  'should minimize CSS with plugin-css-minimizer correctly',
  async () => {
    const rsbuild = await build({
      cwd: __dirname,
      rsbuildConfig: {},
      plugins: [pluginCssMinimizer()],
    });
    const files = await rsbuild.unwrapOutputJSON();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.css'))!];

    expect(content).toEqual(
      '.a,.b{font-size:1.5rem;line-height:1.5;text-align:center}.b{background:#fafafa}',
    );
  },
);
