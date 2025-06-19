import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should log error module trace', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  expect(
    rsbuild.logs.some((log) => log.includes('@ ./src/index.tsx')),
  ).toBeTruthy();
  await rsbuild.close();
});
