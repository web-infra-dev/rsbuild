import { build, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { CreateRsbuildOptions } from '@rsbuild/core';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';

const commonConfig: CreateRsbuildOptions = {
  cwd: __dirname,
  rsbuildConfig: {
    output: {
      minify: false,
    },
  },
};

test('should not transform styled-components by default', async () => {
  const rsbuild = await build(commonConfig);
  const { content } = await rsbuild.getIndexFile();
  expect(content).not.toContain('div.withConfig');
});

rspackOnlyTest(
  'should transform styled-components with pluginStyledComponents',
  async () => {
    const rsbuild = await build({
      ...commonConfig,
      plugins: [pluginStyledComponents()],
    });
    const { content } = await rsbuild.getIndexFile();
    expect(content).toContain('div.withConfig');
  },
);
