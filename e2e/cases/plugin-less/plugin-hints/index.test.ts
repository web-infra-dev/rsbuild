import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should print Less plugin hints as expected',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly({
      catchBuildError: true,
    });

    expect(rsbuild.buildError).toBeTruthy();

    await rsbuild.expectLog(
      'To enable support for Less, use "@rsbuild/plugin-less"',
    );
  },
);
