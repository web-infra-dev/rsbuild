import { expect, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest(
  'should print Sass plugin hints as expected',
  async ({ buildOnly }) => {
    const rsbuild = await buildOnly({
      catchBuildError: true,
    });

    expect(rsbuild.buildError).toBeTruthy();
    await rsbuild.expectLog(
      'To enable support for Sass, use "@rsbuild/plugin-sass"',
    );
  },
);
