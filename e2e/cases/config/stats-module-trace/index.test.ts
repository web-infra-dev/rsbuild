import { expect, test } from '@e2e/helper';

test('should log error module trace', async ({ build }) => {
  const rsbuild = await build({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog('@ ./src/index.tsx');
});
