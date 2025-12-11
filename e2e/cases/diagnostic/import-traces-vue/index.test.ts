import { expect, rspackTest } from '@e2e/helper';

const EXPECTED_LOG = `Import traces (entry → error):
  ./src/index.js
  ./src/App.vue
  ./src/App.vue.css?vue&type=style`;

rspackTest('should print Vue SFC import traces in dev', async ({ dev }) => {
  const rsbuild = await dev();
  await rsbuild.expectLog(EXPECTED_LOG);
});

rspackTest('should print Vue SFC import traces in build', async ({ build }) => {
  const rsbuild = await build({
    catchBuildError: true,
  });

  expect(rsbuild.buildError).toBeTruthy();
  await rsbuild.expectLog(EXPECTED_LOG);
});
