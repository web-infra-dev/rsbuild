import path from 'path';
import { build } from '@scripts/shared';
import { expect, test } from '@playwright/test';
import { pluginSwc } from '@rsbuild/plugin-swc';

const commonConfig = {
  cwd: __dirname,
  entry: { index: path.resolve(__dirname, './src/main.ts') },
  builderConfig: {
    tools: {
      webpack: {
        externals: ['styled-components'],
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
  builderConfig: {
    ...commonConfig.builderConfig,
    tools: {
      ...commonConfig.builderConfig.tools,
      styledComponents: false as const,
    },
  },
};

test('should allow to disable styled-components when use swc plugin', async () => {
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

  expect(content).toContain('div(');
});

test('should transform styled-components by default when use swc plugin', async () => {
  const rsbuild = await build({
    ...commonConfig,
    plugins: [pluginSwc()],
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
