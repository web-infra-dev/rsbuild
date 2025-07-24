import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should allow to re-export type without the type modifier', async ({
  page,
}) => {
  const rsbuild = await build({
    cwd: __dirname,
    page,
    catchBuildError: true,
  });
  expect(rsbuild.buildError).toBeFalsy();
  await rsbuild.close();
});
