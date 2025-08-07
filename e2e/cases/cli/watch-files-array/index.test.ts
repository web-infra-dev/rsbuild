import fs from 'node:fs';
import path from 'node:path';
import { expectFile, getRandomPort, rspackOnlyTest, runCli } from '@e2e/helper';
import { expect } from '@playwright/test';
import { remove } from 'fs-extra';

const tempConfigPath = './test-temp-config.ts';

rspackOnlyTest(
  'should restart dev server when extra config file changed',
  async () => {
    const dist = path.join(__dirname, 'dist');
    const extraConfigFile = path.join(__dirname, tempConfigPath);

    await remove(extraConfigFile);
    await remove(dist);
    fs.writeFileSync(extraConfigFile, 'export default { foo: 1 };');

    const childProcess = runCli('dev', {
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(await getRandomPort()),
      },
    });

    await expectFile(dist);

    await remove(dist);
    // temp config changed
    fs.writeFileSync(extraConfigFile, 'export default { foo: 2 };');

    // rebuild and generate dist files
    await expectFile(dist);
    expect(fs.existsSync(path.join(dist, 'temp.txt')));

    childProcess.kill();
  },
);
