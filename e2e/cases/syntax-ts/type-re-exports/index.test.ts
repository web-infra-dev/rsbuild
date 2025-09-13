import { expect, rspackTest } from '@e2e/helper';

rspackTest(
  'should allow to re-export type without the type modifier',
  async ({ buildPreview }) => {
    const rsbuild = await buildPreview({
      catchBuildError: true,
    });
    expect(rsbuild.buildError).toBeFalsy();
  },
);
