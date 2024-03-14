import { build, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';
import type { CreateRsbuildOptions } from '@rsbuild/shared';

const commonConfig: CreateRsbuildOptions = {
  cwd: __dirname,
  rsbuildConfig: {
    tools: {
      bundlerChain: (chain: any) => {
        chain.externals(['styled-components']);
      },
    },
    output: {
      minify: false,
    },
  },
};

test('should not compiled styled-components by default', async () => {
  const rsbuild = await build(commonConfig);
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];
  expect(content).toContain('div`');
});

rspackOnlyTest(
  'should transform styled-components with pluginStyledComponents',
  async () => {
    const rsbuild = await build({
      ...commonConfig,
      plugins: [pluginStyledComponents()],
    });
    const files = await rsbuild.unwrapOutputJSON();

    const content =
      files[Object.keys(files).find((file) => file.endsWith('.js'))!];

    expect(content).toContain('div.withConfig');
  },
);
