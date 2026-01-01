import fs from 'node:fs';
import { join } from 'node:path';
import { expect, rspackTest, test } from '@e2e/helper';
import fse from 'fs-extra';

test.afterAll(() => {
  const files = fs.readdirSync(import.meta.dirname);
  for (const file of files) {
    if (file.startsWith('.rspack-profile')) {
      fse.removeSync(join(import.meta.dirname, file));
    }
  }
});

const PROFILE_LOG = 'profile file saved to';

const getProfilePath = (logs: string[]) =>
  logs
    .find((log) => log.includes(PROFILE_LOG))
    ?.split(PROFILE_LOG)[1]
    ?.trim();

rspackTest(
  'should generate rspack profile as expected in dev',
  async ({ exec, logHelper }) => {
    exec('node ./dev.js', {
      env: {
        RSPACK_PROFILE: 'OVERVIEW',
      },
    });
    const { logs, expectLog } = logHelper;

    await expectLog(PROFILE_LOG);
    const profileFile = getProfilePath(logs);
    expect(fs.existsSync(profileFile!)).toBeTruthy();
  },
);

rspackTest(
  'should generate rspack profile as expected in build',
  async ({ execCli, logHelper }) => {
    execCli('build', {
      env: {
        RSPACK_PROFILE: 'OVERVIEW',
      },
    });
    const { logs, expectLog } = logHelper;

    await expectLog(PROFILE_LOG);
    const profileFile = getProfilePath(logs);
    expect(fs.existsSync(profileFile!)).toBeTruthy();
  },
);
