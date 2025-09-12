import { expect, test } from '@e2e/helper';

const cwd = __dirname;

test('should not print file size if has errors', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    cwd,
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  rsbuild.expectNoLog('Total:');
});
