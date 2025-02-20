import path from 'node:path';
import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';
import { normalizeToPosixPath } from '@scripts/test-helper';

test('should not compile file which outside of project by default', async () => {
  const { logs, restore } = proxyConsole();
  await expect(
    build({
      cwd: __dirname,
      plugins: [pluginCheckSyntax()],
      rsbuildConfig: {
        output: {
          overrideBrowserslist: ['ie 11'],
        },
      },
    }),
  ).rejects.toThrowError('[@rsbuild/plugin-check-syntax]');

  restore();

  expect(logs.find((log) => log.includes('ERROR 1'))).toBeTruthy();
  expect(
    logs.find(
      (log) =>
        log.includes('source:') &&
        normalizeToPosixPath(log).includes('/dist/static/js/index'),
    ),
  ).toBeTruthy();
});

test('should compile specified file when source.include', async () => {
  await expect(
    build({
      cwd: __dirname,
      plugins: [pluginCheckSyntax()],
      rsbuildConfig: {
        source: {
          include: [path.resolve(__dirname, '../test.js')],
        },
      },
    }),
  ).resolves.toBeDefined();
});
