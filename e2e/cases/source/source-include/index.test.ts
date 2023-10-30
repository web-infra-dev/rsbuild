import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';

test('should not compile file which outside of project by default', async () => {
  await expect(
    build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      plugins: [pluginCheckSyntax()],
      rsbuildConfig: {
        output: {
          overrideBrowserslist: ['ie 11'],
        },
      },
    }),
  ).rejects.toThrowError('[Syntax Checker]');
});

test('should compile specified file when source.include', async () => {
  await expect(
    build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      plugins: [pluginCheckSyntax()],
      rsbuildConfig: {
        source: {
          include: [path.resolve(__dirname, '../test.js')],
        },
      },
    }),
  ).resolves.toBeDefined();
});
