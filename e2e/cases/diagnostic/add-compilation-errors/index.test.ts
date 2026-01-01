import { enableDebugMode, rspackTest } from '@e2e/helper';

const ERROR_MESSAGE = 'Something went wrong';
const ERROR_STACK = / at/;

rspackTest('should print `compilation.errors` by default', async ({ dev }) => {
  const rsbuild = await dev();
  await rsbuild.expectLog(ERROR_MESSAGE);
  rsbuild.expectNoLog(ERROR_STACK);
});

rspackTest(
  'should print `compilation.errors` with stack trace in debug mode',
  async ({ dev }) => {
    const restore = enableDebugMode();
    const rsbuild = await dev();
    await rsbuild.expectLog(ERROR_MESSAGE);
    await rsbuild.expectLog(ERROR_STACK);
    restore();
  },
);
