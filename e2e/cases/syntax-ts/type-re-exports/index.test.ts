import { build, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should allow to re-export type without the type modifier',
  async ({ page }) => {
    const rsbuild = await build({
      cwd: __dirname,
      page,
      catchBuildError: true,
    });
    expect(rsbuild.buildError).toBeFalsy();
    await rsbuild.close();
  },
);
