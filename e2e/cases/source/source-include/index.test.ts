import { expect, test } from '@e2e/helper';

test('should compile modules outside of project by default', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeFalsy();
  expect(
    rsbuild.logs.find((log) => log.includes('Syntax check passed')),
  ).toBeTruthy();
});
