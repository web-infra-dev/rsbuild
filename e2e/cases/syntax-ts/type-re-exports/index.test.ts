import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should allow to re-export type without the type modifier',
  async ({ page, build }) => {
    const rsbuild = await build({
      catchBuildError: true,
    });
    expect(rsbuild.buildError).toBeFalsy();
  },
);
