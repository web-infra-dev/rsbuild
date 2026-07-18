import fs from 'node:fs';
import path from 'node:path';
import { test } from '@e2e/helper';
import { getRandomPort } from '@rstackjs/test-utils';

const watchedFile = path.join(import.meta.dirname, 'test-temp-watch.txt');

test.beforeEach(() => {
  fs.writeFileSync(watchedFile, '1');
});

test('should call onRestart before restarting a watch build', async ({ execCli, logHelper }) => {
  execCli('build --watch');

  const { clearLogs, expectBuildEnd, expectLog } = logHelper;
  await expectBuildEnd();

  clearLogs();
  fs.writeFileSync(watchedFile, '2');
  await expectLog(`onRestart hook called: build, ${watchedFile}`);
  await expectBuildEnd();
});

test('should call onRestart before restarting a dev server', async ({ execCli, logHelper }) => {
  execCli(`dev --port ${await getRandomPort()}`);

  const { clearLogs, expectBuildEnd, expectLog } = logHelper;
  await expectBuildEnd();

  clearLogs();
  fs.writeFileSync(watchedFile, '2');
  await expectLog(`onRestart hook called: dev, ${watchedFile}`);
  await expectBuildEnd();
});
