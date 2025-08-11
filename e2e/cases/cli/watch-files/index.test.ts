import fs from 'node:fs';
import path from 'node:path';
import {
  expectFile,
  expectFileWithContent,
  getRandomPort,
  rspackOnlyTest,
  runCli,
} from '@e2e/helper';
import { test } from '@playwright/test';
import { remove } from 'fs-extra';

const dist = path.join(__dirname, 'dist');
const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
const tempConfigPath = './test-temp-config.ts';
const tempOutputFile = path.join(__dirname, 'test-temp-file.txt');
const extraConfigFile = path.join(__dirname, tempConfigPath);

test.beforeEach(async () => {
  await remove(dist);
  await remove(tempOutputFile);
  await remove(extraConfigFile);
  fs.writeFileSync(extraConfigFile, 'export default 1;');
});

rspackOnlyTest(
  'should restart dev server when extra config file changed',
  async () => {
    const childProcess = runCli('dev', {
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(await getRandomPort()),
        NODE_ENV: 'development',
        WATCH_FILES_TYPE: 'reload-server',
      },
    });

    // the first build
    await expectFile(distIndexFile);
    await expectFileWithContent(tempOutputFile, '1');

    await remove(tempOutputFile);
    // temp config changed and trigger rebuild
    fs.writeFileSync(extraConfigFile, 'export default 2;');

    // rebuild and generate dist files
    await expectFile(tempOutputFile);
    await expectFileWithContent(tempOutputFile, '2');

    childProcess.kill();
  },
);

rspackOnlyTest(
  'should not restart dev server if `watchFiles.type` is `reload-page`',
  async () => {
    const childProcess = runCli('dev', {
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(await getRandomPort()),
        NODE_ENV: 'development',
        WATCH_FILES_TYPE: 'reload-page',
      },
    });

    await expectFile(distIndexFile);
    await expectFileWithContent(tempOutputFile, '1');

    await remove(distIndexFile);
    // temp config changed
    fs.writeFileSync(extraConfigFile, 'export default 2;');

    await expectFile(tempOutputFile);
    await expectFileWithContent(tempOutputFile, '1');

    childProcess.kill();
  },
);

rspackOnlyTest(
  'should not restart dev server if `watchFiles.type` is not set',
  async () => {
    const childProcess = runCli('dev', {
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(await getRandomPort()),
        NODE_ENV: 'development',
      },
    });

    // Fix occasional 'directory not empty' error when wait and rm dist.
    // Sometimes the dist directory exists, but the files in the dist directory have not been completely written.
    await expectFile(distIndexFile);

    await remove(distIndexFile);
    // temp config changed
    fs.writeFileSync(extraConfigFile, 'export default 2;');

    await expectFile(tempOutputFile);
    await expectFileWithContent(tempOutputFile, '1');

    childProcess.kill();
  },
);
