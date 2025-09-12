import { dev, expect, test } from '@e2e/helper';

test('should detect and report missing named export errors during build', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog(
    `export 'aa' (imported as 'aa') was not found in './test'`,
  );
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
});
