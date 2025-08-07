import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import fs from 'node:fs';
import { join } from 'node:path';
import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { expectPoll, rsbuildBinPath, rspackOnlyTest } from '@e2e/helper';
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

const expectProfileFile = async (
  childProcess: ChildProcessWithoutNullStreams,
) => {
  const logs: string[] = [];

  childProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    logs.push(stripAnsi(output));
  });

  await expectPoll(() =>
    logs.some((log) => log.includes('profile file saved to')),
  ).toBeTruthy();

  const profileFile = logs
    .find((log) => log.includes('profile file saved to'))
    ?.split('profile file saved to')[1]
    ?.trim();

  expect(fs.existsSync(profileFile!)).toBeTruthy();
  childProcess.kill();
};

rspackOnlyTest(
  'should generate rspack profile as expected in dev',
  async () => {
    const devProcess = spawn('node', ['./dev.mjs'], {
      cwd: __dirname,
      env: {
        ...process.env,
        RSPACK_PROFILE: 'OVERVIEW',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    await expectProfileFile(devProcess);
  },
);

rspackOnlyTest(
  'should generate rspack profile as expected in build',
  async () => {
    const buildProcess = spawn('node', [rsbuildBinPath, 'build'], {
      cwd: __dirname,
      env: {
        ...process.env,
        RSPACK_PROFILE: 'OVERVIEW',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    await expectProfileFile(buildProcess);
  },
);
