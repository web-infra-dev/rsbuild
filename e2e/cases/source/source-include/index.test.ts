import path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

// TODO: needs builtin:swc-loader
webpackOnlyTest(
  'should not compile file which outside of project by default',
  async () => {
    await expect(
      build({
        cwd: __dirname,
        entry: { index: path.resolve(__dirname, './src/index.js') },
        rsbuildConfig: {
          security: {
            checkSyntax: true,
          },
        },
      }),
    ).rejects.toThrowError('[Syntax Checker]');
  },
);

test('should compile specified file when source.include', async () => {
  await expect(
    build({
      cwd: __dirname,
      entry: { index: path.resolve(__dirname, './src/index.js') },
      rsbuildConfig: {
        source: {
          include: [path.resolve(__dirname, '../test.js')],
        },
        security: {
          checkSyntax: true,
        },
      },
    }),
  ).resolves.toBeDefined();
});
