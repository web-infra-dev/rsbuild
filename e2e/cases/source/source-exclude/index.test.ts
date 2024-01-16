import path from 'path';
import { expect, test } from '@playwright/test';
import { build, proxyConsole } from '@e2e/helper';
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
  ).rejects.toThrowError('[Syntax Checker]');

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
