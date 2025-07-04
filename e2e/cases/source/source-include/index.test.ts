import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should compile modules outside of project by default', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeFalsy();
  expect(
    rsbuild.logs.find((log) => log.includes('Syntax check passed')),
  ).toBeTruthy();

  await rsbuild.close();
});
