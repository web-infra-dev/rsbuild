import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should print Less plugin hints as expected', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  expect(
    rsbuild.logs.some((log) =>
      log.includes('To enable support for Less, use "@rsbuild/plugin-less"'),
    ),
  ).toBeTruthy();

  await rsbuild.close();
});
