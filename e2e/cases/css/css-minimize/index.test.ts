import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { rspackOnlyTest } from '@scripts/helper';
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
    '.a{text-align:center;line-height:1.5;font-size:1.5rem}.b{text-align:center;line-height:1.5;font-size:1.5rem;background:#fafafa}',
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
