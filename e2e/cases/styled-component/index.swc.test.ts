import path from 'path';
import { build } from '@scripts/shared';
import { expect, test } from '@playwright/test';
import { pluginSwc } from '@rsbuild/plugin-swc';
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
      // avoid unwrapOutputJSON conflict
      distPath: {
        root: 'dist-swc',
      },
    },
  },
};

const noStyledConfig = {
  ...commonConfig,
  rsbuildConfig: {
    ...commonConfig.rsbuildConfig,
    tools: {
      ...commonConfig.rsbuildConfig.tools,
      styledComponents: false as const,
    },
  },
};

test('should not compiled styled-components by default when use swc plugin', async () => {
  const rsbuild = await build({
    ...noStyledConfig,
    plugins: [pluginSwc()],
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[
      Object.keys(files).find(
        (file) => file.includes('static/js') && file.endsWith('.js'),
      )!
    ];

  expect(content).toContain('div`');
});

test('should transform styled-components when add extensions.styledComponents', async () => {
  const rsbuild = await build({
    ...commonConfig,
    plugins: [
      pluginSwc({
        extensions: {
          styledComponents: {},
        },
      }),
    ],
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[
      Object.keys(files).find(
        (file) => file.includes('static/js') && file.endsWith('.js'),
      )!
    ];

  expect(content).toContain('div.withConfig');
});

test('should transform styled-components when use pluginStyledComponents', async () => {
  const rsbuild = await build({
    ...commonConfig,
    plugins: [pluginSwc(), pluginStyledComponents()],
  });
  const files = await rsbuild.unwrapOutputJSON();

  const content =
    files[
      Object.keys(files).find(
        (file) => file.includes('static/js') && file.endsWith('.js'),
      )!
    ];

  expect(content).toContain('div.withConfig');
});
