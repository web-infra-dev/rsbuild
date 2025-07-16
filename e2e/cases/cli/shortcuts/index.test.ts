import { exec } from 'node:child_process';
import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { expectPoll, rspackOnlyTest } from '@e2e/helper';

rspackOnlyTest('should display shortcuts as expected in dev', async () => {
  const devProcess = exec('node ./dev.mjs', {
    cwd: __dirname,
  });

  let logs: string[] = [];

  devProcess.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    logs.push(stripAnsi(output));
  });

  // help
  await expectPoll(() =>
    logs.some((log) => log.includes('press h + enter to show shortcuts')),
  ).toBeTruthy();
  devProcess.stdin?.write('h\n');
  await expectPoll(() =>
    logs.some((log) => log.includes('u + enter  show urls')),
  ).toBeTruthy();

  // print urls
  logs = [];
  devProcess.stdin?.write('u\n');
  await expectPoll(() =>
    logs.some((log) => log.includes('➜  Local:    http://localhost:')),
  ).toBeTruthy();

  // restart server
  logs = [];
  devProcess.stdin?.write('r\n');
  await expectPoll(() =>
    logs.some((log) => log.includes('restarting server')),
  ).toBeTruthy();
  await expectPoll(() =>
    logs.some((log) => log.includes('➜  Local:    http://localhost:')),
  ).toBeTruthy();

  devProcess.kill();
});

rspackOnlyTest('should display shortcuts as expected in preview', async () => {
  const devProcess = exec('node ./preview.mjs', {
    cwd: __dirname,
  });

  let logs: string[] = [];

  devProcess.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    logs.push(stripAnsi(output));
  });

  // help
  await expectPoll(() =>
    logs.some((log) => log.includes('press h + enter to show shortcuts')),
  ).toBeTruthy();
  devProcess.stdin?.write('h\n');
  await expectPoll(() =>
    logs.some((log) => log.includes('u + enter  show urls')),
  ).toBeTruthy();

  // print urls
  logs = [];
  devProcess.stdin?.write('u\n');
  await expectPoll(() =>
    logs.some((log) => log.includes('➜  Local:    http://localhost:')),
  ).toBeTruthy();

  devProcess.kill();
});

rspackOnlyTest('should allow to custom shortcuts in dev', async () => {
  const devProcess = exec('node ./devCustom.mjs', {
    cwd: __dirname,
  });

  let logs: string[] = [];

  devProcess.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    logs.push(stripAnsi(output));
  });

  await expectPoll(() =>
    logs.some((log) => log.includes('press h + enter to show shortcuts')),
  ).toBeTruthy();

  logs = [];
  devProcess.stdin?.write('s\n');
  await expectPoll(() =>
    logs.some((log) => log.includes('hello world!')),
  ).toBeTruthy();

  devProcess.kill();
});

rspackOnlyTest('should allow to custom shortcuts in preview', async () => {
  const devProcess = exec('node ./previewCustom.mjs', {
    cwd: __dirname,
  });

  let logs: string[] = [];

  devProcess.stdout?.on('data', (data) => {
    const output = data.toString().trim();
    logs.push(stripAnsi(output));
  });

  // help
  await expectPoll(() =>
    logs.some((log) => log.includes('press h + enter to show shortcuts')),
  ).toBeTruthy();

  logs = [];
  devProcess.stdin?.write('s\n');
  await expectPoll(() =>
    logs.some((log) => log.includes('hello world!')),
  ).toBeTruthy();

  devProcess.kill();
});
