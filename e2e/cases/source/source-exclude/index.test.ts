import path from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';
import { normalizeToPosixPath } from '@scripts/test-helper';

test('should not compile specified file when source.exclude', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    plugins: [pluginCheckSyntax()],
    catchBuildError: true,
    rsbuildConfig: {
      source: {
        exclude: [path.resolve(__dirname, './src/test.js')],
      },
      output: {
        overrideBrowserslist: ['ie 11'],
      },
    },
  });

  expect(rsbuild.buildError).toBeTruthy();
  expect(rsbuild.logs.find((log) => log.includes('ERROR 1'))).toBeTruthy();
  expect(
    rsbuild.logs.find(
      (log) =>
        log.includes('source:') &&
        normalizeToPosixPath(log).includes('/dist/static/js/index'),
    ),
  ).toBeTruthy();
});
