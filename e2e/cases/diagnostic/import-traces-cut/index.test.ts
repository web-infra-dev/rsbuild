import { expect, test } from '@e2e/helper';

const EXPECTED_LOG = `Import traces (entry → error):
  ./src/index.js
  ./src/child1.js
  … (3 hidden)
  ./src/child5.js
  ./src/child6.js ×`;

test('should truncate long import trace and show hidden count in dev', async ({
  dev,
}) => {
  const rsbuild = await dev();
  await rsbuild.expectLog(EXPECTED_LOG);
});

test('should truncate long import trace and show hidden count in build', async ({
  build,
}) => {
  const rsbuild = await build({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog(EXPECTED_LOG);
});
