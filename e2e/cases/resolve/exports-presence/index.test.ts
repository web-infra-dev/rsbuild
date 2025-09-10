import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should detect and report missing named export errors during build', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog(
    `export 'aa' (imported as 'aa') was not found in './test'`,
  );
  await rsbuild.close();
});

test('should detect and report missing named export errors in dev', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd: __dirname,
    page,
  });

  await rsbuild.expectLog(
    `export 'aa' (imported as 'aa') was not found in './test'`,
  );
  await rsbuild.close();
});
