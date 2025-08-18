import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should log error module trace', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog('@ ./src/index.tsx');
  await rsbuild.close();
});
