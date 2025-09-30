import { expect, test } from '@e2e/helper';

const EXPECTED_LOG = `Import traces (entry → error):
  ./src/index.js
  ./src/child1.js
  ./src/child2.js
  ./src/child3.js ×`;

test('should print import traces if module build failed in dev', async ({
  dev,
}) => {
  const rsbuild = await dev();
  await rsbuild.expectLog(EXPECTED_LOG);
});

test('should print import traces if module build failed in build', async ({
  build,
}) => {
  const rsbuild = await build({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog(EXPECTED_LOG);
});
