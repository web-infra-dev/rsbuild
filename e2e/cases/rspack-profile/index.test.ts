import { exec } from 'node:child_process';
import fs from 'node:fs';
import { join } from 'node:path';
import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { expectPoll, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { removeSync } from 'fs-extra';

test.afterAll(() => {
  const files = fs.readdirSync(__dirname);
  for (const file of files) {
    if (file.startsWith('.rspack-profile')) {
      removeSync(join(__dirname, file));
    }
  }
});

rspackOnlyTest(
  'should generator rspack profile as expected in dev',
  async () => {
    const devProcess = exec('node ./dev.mjs', {
      cwd: __dirname,
      env: {
        ...process.env,
        RSPACK_PROFILE: 'OVERVIEW',
      },
    });

    const logs: string[] = [];

    devProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      logs.push(stripAnsi(output));
    });

    await expectPoll(() =>
      logs.some((log) => log.includes('built in')),
    ).toBeTruthy();

    // quit process
    devProcess.stdin?.write('q\n');
    await expectPoll(() =>
      logs.some((log) => log.includes('profile file saved to')),
    ).toBeTruthy();

    const profileFile = logs
      .find((log) => log.includes('profile file saved to'))
      ?.split('profile file saved to')[1]
      ?.trim();

    expect(fs.existsSync(profileFile!)).toBeTruthy();
    devProcess.kill();
  },
);

rspackOnlyTest(
  'should generator rspack profile as expected in build',
  async () => {
    const buildProcess = exec('npx rsbuild build', {
      cwd: __dirname,
      env: {
        ...process.env,
        RSPACK_PROFILE: 'OVERVIEW',
      },
    });

    const logs: string[] = [];

    buildProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      logs.push(stripAnsi(output));
    });

    await expectPoll(() =>
      logs.some((log) => log.includes('built in')),
    ).toBeTruthy();

    await expectPoll(() =>
      logs.some((log) => log.includes('profile file saved to')),
    ).toBeTruthy();

    const profileFile = logs
      .find((log) => log.includes('profile file saved to'))
      ?.split('profile file saved to')[1]
      ?.trim();

    expect(fs.existsSync(profileFile!)).toBeTruthy();
    buildProcess.kill();
  },
);
