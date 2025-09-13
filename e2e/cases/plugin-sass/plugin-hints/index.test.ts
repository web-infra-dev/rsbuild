import { expect, rspackTest } from '@e2e/helper';

rspackTest('should print Sass plugin hints as expected', async ({ build }) => {
  const rsbuild = await build({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog(
    'To enable support for Sass, use "@rsbuild/plugin-sass"',
  );
});
