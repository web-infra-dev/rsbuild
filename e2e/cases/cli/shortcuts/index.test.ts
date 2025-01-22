import { exec } from 'node:child_process';
import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { rspackOnlyTest, waitFor } from '@e2e/helper';
import { expect } from '@playwright/test';

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
  expect(
    await waitFor(() =>
      logs.some((log) => log.includes('press h + enter to show shortcuts')),
    ),
  ).toBeTruthy();
  devProcess.stdin?.write('h\n');
  expect(
    await waitFor(() =>
      logs.some((log) => log.includes('u + enter  show urls')),
    ),
  ).toBeTruthy();

  // print urls
  logs = [];
  devProcess.stdin?.write('u\n');
  expect(
    await waitFor(() =>
      logs.some((log) => log.includes('➜ Local:    http://localhost:')),
    ),
  ).toBeTruthy();

  // restart server
  logs = [];
  devProcess.stdin?.write('r\n');
  expect(
    await waitFor(() => logs.some((log) => log.includes('Restarting server'))),
  ).toBeTruthy();
  expect(
    await waitFor(() =>
      logs.some((log) => log.includes('➜ Local:    http://localhost:')),
    ),
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
  expect(
    await waitFor(() =>
      logs.some((log) => log.includes('press h + enter to show shortcuts')),
    ),
  ).toBeTruthy();
  devProcess.stdin?.write('h\n');
  expect(
    await waitFor(() =>
      logs.some((log) => log.includes('u + enter  show urls')),
    ),
  ).toBeTruthy();

  // print urls
  logs = [];
  devProcess.stdin?.write('u\n');
  expect(
    await waitFor(() =>
      logs.some((log) => log.includes('➜ Local:    http://localhost:')),
    ),
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

  expect(
    await waitFor(() =>
      logs.some((log) => log.includes('press h + enter to show shortcuts')),
    ),
  ).toBeTruthy();

  logs = [];
  devProcess.stdin?.write('s\n');
  expect(
    await waitFor(() => logs.some((log) => log.includes('hello world!'))),
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
  expect(
    await waitFor(() =>
      logs.some((log) => log.includes('press h + enter to show shortcuts')),
    ),
  ).toBeTruthy();

  logs = [];
  devProcess.stdin?.write('s\n');
  expect(
    await waitFor(() => logs.some((log) => log.includes('hello world!'))),
  ).toBeTruthy();

  devProcess.kill();
});
