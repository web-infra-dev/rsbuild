import fs from 'node:fs';
import { join } from 'node:path';
import { rspackOnlyTest, runCli, runCommand } from '@e2e/helper';
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

const PROFILE_LOG = 'profile file saved to';

const getProfilePath = (logs: string[]) =>
  logs
    .find((log) => log.includes(PROFILE_LOG))
    ?.split(PROFILE_LOG)[1]
    ?.trim();

rspackOnlyTest(
  'should generate rspack profile as expected in dev',
  async () => {
    const { getLogs, close, expectLog } = runCommand('node ./dev.mjs', {
      cwd: __dirname,
      env: {
        ...process.env,
        RSPACK_PROFILE: 'OVERVIEW',
      },
    });

    await expectLog(PROFILE_LOG);
    const profileFile = getProfilePath(getLogs());
    expect(fs.existsSync(profileFile!)).toBeTruthy();
    close();
  },
);

rspackOnlyTest(
  'should generate rspack profile as expected in build',
  async () => {
    const { getLogs, close, expectLog } = runCli('build', {
      cwd: __dirname,
      env: {
        ...process.env,
        RSPACK_PROFILE: 'OVERVIEW',
      },
    });

    await expectLog(PROFILE_LOG);
    const profileFile = getProfilePath(getLogs());
    expect(fs.existsSync(profileFile!)).toBeTruthy();
    close();
  },
);
