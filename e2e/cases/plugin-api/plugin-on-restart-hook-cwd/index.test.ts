import fs from 'node:fs';
import path from 'node:path';
import { test } from '@e2e/helper';

const watchedFile = path.join(import.meta.dirname, 'test-temp-watch.txt');

test('should resolve restart file path from custom watch cwd', async ({ execCli, logHelper }) => {
  fs.writeFileSync(watchedFile, '1');
  execCli('build --watch');

  const { clearLogs, expectBuildEnd, expectLog } = logHelper;
  await expectBuildEnd();

  clearLogs();
  fs.writeFileSync(watchedFile, '2');
  await expectLog(`onRestart hook called: build, ${watchedFile}`);
  await expectBuildEnd();
});
