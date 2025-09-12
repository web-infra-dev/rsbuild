import path from 'node:path';
import { expect, test, toPosixPath } from '@e2e/helper';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';

test('should not compile specified file when source.exclude', async ({
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    plugins: [pluginCheckSyntax()],
    catchBuildError: true,
    rsbuildConfig: {
      source: {
        exclude: [path.resolve(__dirname, './src/test.js')],
      },
      output: {
        overrideBrowserslist: ['android >= 4.4'],
      },
    },
  });

  expect(rsbuild.buildError).toBeTruthy();
  expect(rsbuild.logs.find((log) => log.includes('ERROR 1'))).toBeTruthy();
  expect(
    rsbuild.logs.find(
      (log) =>
        log.includes('source:') &&
        toPosixPath(log).includes('/dist/static/js/index'),
    ),
  ).toBeTruthy();
});
