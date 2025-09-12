import { expect, test } from '@e2e/helper';

test('should log error module trace', async ({ buildOnly }) => {
  const rsbuild = await buildOnly({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog('@ ./src/index.tsx');
});
