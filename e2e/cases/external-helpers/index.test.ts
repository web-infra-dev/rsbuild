import path from 'node:path';
import { build, providerType } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginSwc } from '@rsbuild/plugin-swc';

test('should externalHelpers by default', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: providerType === 'rspack' ? [] : [pluginSwc()],
    rsbuildConfig: {
      source: {
        entry: { index: path.resolve(__dirname, './src/main.ts') },
      },
      output: {
        sourceMap: {
          js: 'source-map',
        },
      },
    },
  });
  const files = await rsbuild.unwrapOutputJSON(false);

  const content =
    files[
      Object.keys(files).find(
        (file) => file.includes('static/js') && file.endsWith('.js.map'),
      )!
    ];

  expect(content).toContain('@swc/helpers');
});
