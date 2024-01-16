import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginStyledComponents } from '@rsbuild/plugin-styled-components';

const commonConfig = {
  cwd: __dirname,
  rsbuildConfig: {
    tools: {
      bundlerChain: (chain: any) => {
        chain.externals(['styled-components']);
      },
    },
    output: {
      disableMinimize: true,
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

test('should transform styled-components', async () => {
  const rsbuild = await build({
    ...commonConfig,
    plugins: [pluginStyledComponents()],
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find((file) => file.endsWith('.js'))!];

  expect(content).toContain('div.withConfig');
});
