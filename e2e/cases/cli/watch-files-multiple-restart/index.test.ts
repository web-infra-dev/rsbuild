import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';

const defaultFile = path.join(import.meta.dirname, 'test-temp-default.txt');
const customFile = path.join(import.meta.dirname, 'test-temp-custom.txt');
const defaultRestartLog = 'restarting build as test-temp-default.txt changed';

test('should restart once with multiple restart watchers', async ({ execCli, logHelper }) => {
  fs.writeFileSync(defaultFile, '1');
  fs.writeFileSync(customFile, '1');
  execCli('build --watch');

  const { clearLogs, expectBuildEnd, expectLog } = logHelper;
  await expectBuildEnd();

  clearLogs();
  fs.writeFileSync(customFile, '2');
  await expectLog('restarting build as test-temp-custom.txt changed');
  await expectBuildEnd();

  clearLogs();
  fs.writeFileSync(defaultFile, '2');
  await expectLog(defaultRestartLog);
  await expectBuildEnd();

  expect(logHelper.logs.filter((log) => log.includes(defaultRestartLog))).toHaveLength(1);
});
