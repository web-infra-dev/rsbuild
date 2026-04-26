import { expect, test } from '@e2e/helper';

const EXPECTED_ERROR =
  '[rsbuild:css] CSS Modules do not support the ?url query. Use ?inline to import the compiled CSS content as a string.';

test('should throw error when importing CSS Modules with `?url`', async ({
  build,
}) => {
  const rsbuild = await build({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog(EXPECTED_ERROR);
});
