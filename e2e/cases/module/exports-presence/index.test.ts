import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should throw error by default (exportsPresence error)', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  expect(
    rsbuild.logs.find((log) =>
      log.includes(`export 'aa' (imported as 'aa') was not found in './test'`),
    ),
  ).toBeTruthy();

  await rsbuild.close();
});
