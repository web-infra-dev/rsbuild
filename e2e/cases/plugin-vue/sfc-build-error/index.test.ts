import { rspackTest } from '@e2e/helper';

const EXPECTED_FILE = 'File: ./src/App.vue.js?vue&type=script&lang=js:1:0-312';
const EXPECTED_ERROR = `× ESModulesLinkingError: export 'default' (reexported as 'default') was not found`;

rspackTest('should display Vue compilation error in dev', async ({ dev }) => {
  const rsbuild = await dev();
  await rsbuild.expectLog(EXPECTED_FILE, { strict: true });
  await rsbuild.expectLog(EXPECTED_ERROR);
});

rspackTest(
  'should display Vue compilation error in build',
  async ({ build }) => {
    const rsbuild = await build({
      catchBuildError: true,
    });
    await rsbuild.expectLog(EXPECTED_FILE, { strict: true });
    await rsbuild.expectLog(EXPECTED_ERROR);
  },
);
