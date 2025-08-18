import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest('should print Less plugin hints as expected', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();

  await rsbuild.expectLog(
    'To enable support for Less, use "@rsbuild/plugin-less"',
  );
  await rsbuild.close();
});
