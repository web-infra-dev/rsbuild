import { rspackTest } from '@e2e/helper';

rspackTest(
  'should display shortcuts as expected in dev',
  async ({ exec, logHelper }) => {
    const { childProcess } = exec('node ./dev.mjs');
    const { expectLog, clearLogs } = logHelper;

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
  },
);

rspackTest(
  'should display shortcuts as expected in preview',
  async ({ exec, logHelper }) => {
    const { childProcess } = exec('node ./preview.mjs');
    const { expectLog, clearLogs } = logHelper;

    // help
    await expectLog('press h + enter to show shortcuts');
    childProcess.stdin?.write('h\n');
    await expectLog('u + enter  show urls');

    // print urls
    clearLogs();
    childProcess.stdin?.write('u\n');
    await expectLog('➜  Local:    http://localhost:');
  },
);

rspackTest(
  'should support custom shortcuts in dev',
  async ({ exec, logHelper }) => {
    const { childProcess } = exec('node ./devCustom.mjs');
    const { expectLog, clearLogs } = logHelper;

    await expectLog('press h + enter to show shortcuts');

    clearLogs();
    childProcess.stdin?.write('s\n');
    await expectLog('hello world!');
  },
);

rspackTest(
  'should support custom shortcuts in preview',
  async ({ exec, logHelper }) => {
    const { childProcess } = exec('node ./previewCustom.mjs');
    const { expectLog, clearLogs } = logHelper;

    // help
    await expectLog('press h + enter to show shortcuts');

    clearLogs();
    childProcess.stdin?.write('s\n');
    await expectLog('hello world!');
  },
);
