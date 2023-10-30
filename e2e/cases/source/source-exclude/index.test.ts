import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';

test('should not compile specified file when source.exclude', async () => {
  await expect(
    build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      plugins: [pluginCheckSyntax()],
      rsbuildConfig: {
        source: {
          exclude: [path.resolve(__dirname, './src/test.js')],
        },
        output: {
          overrideBrowserslist: ['ie 11'],
        },
      },
    }),
  ).rejects.toThrowError('[Syntax Checker]');
});
