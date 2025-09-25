import { test } from '@e2e/helper';

test('should forward browser unhandled rejection logs to terminal', async ({
  dev,
}) => {
  const rsbuild = await dev();
  await rsbuild.expectLog('error   [browser] Uncaught (in promise) 404');
  await rsbuild.expectLog('error   [browser] Uncaught (in promise) false');
  await rsbuild.expectLog('error   [browser] Uncaught (in promise) null');
  await rsbuild.expectLog('error   [browser] Uncaught (in promise) undefined');
  await rsbuild.expectLog('error   [browser] Uncaught (in promise) string');
  await rsbuild.expectLog(
    'error   [browser] Uncaught (in promise) {"name":"Custom","message":"custom message"}',
  );
  await rsbuild.expectLog(
    'error   [browser] Uncaught (in promise) Error: reason',
  );
  await rsbuild.expectLog(
    'error   [browser] Uncaught (in promise) AbortError: Aborted',
  );
  await rsbuild.expectLog(
    'error   [browser] Uncaught (in promise) Error: Thrown in async',
  );
  await rsbuild.expectLog(
    'error   [browser] Uncaught (in promise) AbortError: signal is aborted without reason',
  );
  await rsbuild.expectLog(
    'error   [browser] Uncaught (in promise) AggregateError: All promises were rejected',
  );
});
