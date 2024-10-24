import path from 'node:path';
import { build, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';
import { normalizeToPosixPath } from '@scripts/test-helper';

test('should not compile specified file when source.exclude', async () => {
  const { logs, restore } = proxyConsole();
  await expect(
    build({
      cwd: __dirname,
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
