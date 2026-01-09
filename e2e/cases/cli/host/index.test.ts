import { NETWORK_LOG_REGEX, test } from '@e2e/helper';

test('should listen on localhost by default', async ({
  execCli,
  logHelper,
}) => {
  execCli('dev');
  await logHelper.expectBuildEnd();
  await logHelper.expectLog('➜  Local:    http://localhost:');
  logHelper.expectNoLog(NETWORK_LOG_REGEX);
});

test('should listen on all interfaces when host is true', async ({
  execCli,
  logHelper,
}) => {
  execCli('dev --host');
  await logHelper.expectBuildEnd();
  await logHelper.expectLog('➜  Local:    http://localhost:');
  await logHelper.expectLog(NETWORK_LOG_REGEX);
});

test('should listen on all interfaces when host is 0.0.0.0', async ({
  execCli,
  logHelper,
}) => {
  execCli('dev --host 0.0.0.0');
  await logHelper.expectBuildEnd();
  await logHelper.expectLog('➜  Local:    http://localhost:');
  await logHelper.expectLog(NETWORK_LOG_REGEX);
});
