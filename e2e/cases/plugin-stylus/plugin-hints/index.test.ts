import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should print Stylus plugin hints as expected',
  async ({ build, buildOnly }) => {
    const rsbuild = await buildOnly({
      catchBuildError: true,
    });

    expect(rsbuild.buildError).toBeTruthy();
    await rsbuild.expectLog(
      'To enable support for Stylus, use "@rsbuild/plugin-stylus"',
    );
  },
);
