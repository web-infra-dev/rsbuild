import { exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expectFile, getRandomPort, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const dist = path.join(__dirname, 'dist');
const distIndexFile = path.join(__dirname, 'dist/static/js/index.js');
const tempConfigPath = './test-temp-config.ts';
const tempOutputFile = path.join(__dirname, 'test-temp-file.txt');
const extraConfigFile = path.join(__dirname, tempConfigPath);

test.beforeEach(() => {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.rmSync(tempOutputFile, { force: true });
  fs.rmSync(extraConfigFile, { force: true });
  fs.writeFileSync(extraConfigFile, 'export default 1;');
});

rspackOnlyTest(
  'should restart dev server when extra config file changed',
  async () => {
    const childProcess = exec('npx rsbuild dev', {
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(await getRandomPort()),
        WATCH_FILES_TYPE: 'reload-server',
      },
    });

    // the first build
    await expectFile(distIndexFile);

    fs.rmSync(tempOutputFile, { force: true });
    // temp config changed and trigger rebuild
    fs.writeFileSync(extraConfigFile, 'export default 2;');

    // rebuild and generate dist files
    await expectFile(tempOutputFile);
    expect(fs.readFileSync(tempOutputFile, 'utf-8')).toEqual('2');

    childProcess.kill();
  },
);

rspackOnlyTest(
  'should not restart dev server if `watchFiles.type` is `reload-page`',
  async () => {
    const childProcess = exec('npx rsbuild dev', {
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(await getRandomPort()),
        WATCH_FILES_TYPE: 'reload-page',
      },
    });

    await expectFile(distIndexFile);

    fs.rmSync(distIndexFile);
    // temp config changed
    fs.writeFileSync(extraConfigFile, 'export default 2;');

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(fs.readFileSync(tempOutputFile, 'utf-8')).toEqual('1');

    childProcess.kill();
  },
);

rspackOnlyTest(
  'should not restart dev server if `watchFiles.type` is not set',
  async () => {
    const childProcess = exec('npx rsbuild dev', {
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(await getRandomPort()),
      },
    });

    // Fix occasional 'directory not empty' error when wait and rm dist.
    // Sometimes the dist directory exists, but the files in the dist directory have not been completely written.
    await expectFile(distIndexFile);

    fs.rmSync(distIndexFile);
    // temp config changed
    fs.writeFileSync(extraConfigFile, 'export default 2;');

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(fs.readFileSync(tempOutputFile, 'utf-8')).toEqual('1');

    childProcess.kill();
  },
);
