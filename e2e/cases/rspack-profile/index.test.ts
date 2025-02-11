import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { rspackOnlyTest, waitFor } from '@e2e/helper';
import { expect } from '@playwright/test';

rspackOnlyTest(
  'should generator rspack profile as expected in dev',
  async () => {
    const devProcess = exec('RSPACK_PROFILE=ALL node ./dev.mjs', {
      cwd: __dirname,
    });

    const logs: string[] = [];

    devProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      logs.push(stripAnsi(output));
      console.log(output);
    });

    expect(
      await waitFor(() => logs.some((log) => log.includes('Built in'))),
    ).toBeTruthy();

    // quit process
    devProcess.stdin?.write('q\n');
    expect(
      await waitFor(() =>
        logs.some((log) => log.includes('Saved Rspack profile file to')),
      ),
    ).toBeTruthy();

    const profileDir = logs
      .find((log) => log.includes('Saved Rspack profile file to'))
      ?.split('Saved Rspack profile file to')[1]
      ?.trim();

    expect(fs.existsSync(path.join(profileDir!, 'trace.json'))).toBeTruthy();
    expect(
      fs.existsSync(path.join(profileDir!, 'jscpuprofile.json')),
    ).toBeTruthy();

    devProcess.kill();
  },
);

rspackOnlyTest(
  'should generator rspack profile as expected in build',
  async () => {
    const buildProcess = exec('RSPACK_PROFILE=ALL npx rsbuild build', {
      cwd: __dirname,
    });

    const logs: string[] = [];

    buildProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      logs.push(stripAnsi(output));
      console.log(output);
    });

    expect(
      await waitFor(() => logs.some((log) => log.includes('Built in'))),
    ).toBeTruthy();

    expect(
      await waitFor(() =>
        logs.some((log) => log.includes('Saved Rspack profile file to')),
      ),
    ).toBeTruthy();

    const profileDir = logs
      .find((log) => log.includes('Saved Rspack profile file to'))
      ?.split('Saved Rspack profile file to')[1]
      ?.trim();

    expect(fs.existsSync(path.join(profileDir!, 'trace.json'))).toBeTruthy();
    expect(
      fs.existsSync(path.join(profileDir!, 'jscpuprofile.json')),
    ).toBeTruthy();
    expect(fs.existsSync(path.join(profileDir!, 'logging.json'))).toBeTruthy();

    buildProcess.kill();
  },
);
