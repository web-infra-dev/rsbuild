import { rspackTest, runCommand } from '@e2e/helper';

rspackTest('should display shortcuts as expected in dev', async () => {
  const { childProcess, expectLog, clearLogs, close } = runCommand(
    'node ./dev.mjs',
    {
      cwd: __dirname,
    },
  );

  // help
  await expectLog('press h + enter to show shortcuts');
  childProcess.stdin?.write('h\n');
  await expectLog('u + enter  show urls');

  // print urls
  clearLogs();
  childProcess.stdin?.write('u\n');
  await expectLog('➜  Local:    http://localhost:');

  // restart server
  clearLogs();
  childProcess.stdin?.write('r\n');
  await expectLog('restarting server');
  await expectLog('➜  Local:    http://localhost:');

  close();
});

rspackTest('should display shortcuts as expected in preview', async () => {
  const { childProcess, expectLog, clearLogs, close } = runCommand(
    'node ./preview.mjs',
    {
      cwd: __dirname,
    },
  );

  // help
  await expectLog('press h + enter to show shortcuts');
  childProcess.stdin?.write('h\n');
  await expectLog('u + enter  show urls');

  // print urls
  clearLogs();
  childProcess.stdin?.write('u\n');
  await expectLog('➜  Local:    http://localhost:');

  close();
});

rspackTest('should support custom shortcuts in dev', async () => {
  const { childProcess, expectLog, clearLogs, close } = runCommand(
    'node ./devCustom.mjs',
    {
      cwd: __dirname,
    },
  );

  await expectLog('press h + enter to show shortcuts');

  clearLogs();
  childProcess.stdin?.write('s\n');
  await expectLog('hello world!');

  close();
});

rspackTest('should support custom shortcuts in preview', async () => {
  const { childProcess, expectLog, clearLogs, close } = runCommand(
    'node ./previewCustom.mjs',
    {
      cwd: __dirname,
    },
  );

  // help
  await expectLog('press h + enter to show shortcuts');

  clearLogs();
  childProcess.stdin?.write('s\n');
  await expectLog('hello world!');

  close();
});
