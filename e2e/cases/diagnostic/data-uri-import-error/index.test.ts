import { expect, test } from '@e2e/helper';

const EXPECTED_LOG = `File: data-uri virtual module (import "un-existing-module")`;

test('should print data-uri virtual module error if module build failed in dev', async ({
  dev,
}) => {
  const rsbuild = await dev();
  await rsbuild.expectLog(EXPECTED_LOG);
});

test('should print data-uri virtual module error if module build failed in build', async ({
  build,
}) => {
  const rsbuild = await build({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog(EXPECTED_LOG);
});
