import { expect, test } from '@e2e/helper';

const EXPECTED_ERROR = 'CSS Modules do not support the ?url query';

test('should throw error when importing CSS Modules with `?url`', async ({
  build,
}) => {
  const rsbuild = await build({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog(EXPECTED_ERROR);
});
