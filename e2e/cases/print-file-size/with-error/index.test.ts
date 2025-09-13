import { expect, test } from '@e2e/helper';

const cwd = __dirname;

test('should not print file size if has errors', async ({ build }) => {
  const rsbuild = await build({
    cwd,
    catchBuildError: true,
  });
  expect(rsbuild.buildError).toBeTruthy();
  rsbuild.expectNoLog('Total:');
});
