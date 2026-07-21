import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';
import { getRandomPort } from '@rstackjs/test-utils';

const watchedFile = path.join(import.meta.dirname, 'test-temp-watch.txt');
const restartLog = 'restarting server as test-temp-watch.txt changed';

test.beforeEach(() => {
  fs.writeFileSync(watchedFile, '1');
});

test.afterAll(() => {
  fs.rmSync(watchedFile, { force: true });
});

test('should close the old watcher after a shortcut restart', async ({ exec, logHelper }) => {
  const port = await getRandomPort();
  const { childProcess } = exec('node ./dev.js', {
    env: {
      PORT: String(port),
    },
  });
  const { clearLogs, expectBuildEnd, expectLog, logs } = logHelper;

  await expectBuildEnd();
  clearLogs();
  childProcess.stdin?.write('r\n');
  await expectLog('restarting server');
  await expectBuildEnd();

  clearLogs();
  fs.writeFileSync(watchedFile, '2');
  await expectLog(restartLog);
  await expectBuildEnd();

  expect(logs.filter((log) => log.includes(restartLog))).toHaveLength(1);
});
