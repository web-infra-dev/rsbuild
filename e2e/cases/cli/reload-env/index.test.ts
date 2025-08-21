import fs from 'node:fs';
import path from 'node:path';
import {
  expectFileWithContent,
  getRandomPort,
  rspackOnlyTest,
  runCli,
} from '@e2e/helper';

rspackOnlyTest.skip(
  'should restart dev server when .env file is changed',
  async () => {
    const dist = path.join(__dirname, 'dist');
    const configFile = path.join(__dirname, 'rsbuild.config.mjs');
    const envLocalFile = path.join(__dirname, '.env.local');
    const distIndex = path.join(dist, 'static/js/async/src_index_js.js');

    fs.writeFileSync(envLocalFile, 'PUBLIC_NAME=jack');
    fs.writeFileSync(
      configFile,
      `export default {
      dev: {
        writeToDisk: true,
      },
      output: {
        filenameHash: false,
      },
      server: { port: ${await getRandomPort()} }
    };`,
    );

    const { close, clearLogs, expectLog, expectBuildEnd } = runCli('dev', {
      cwd: __dirname,
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    });

    // await page.browser.newPage()

    await expectBuildEnd();
    await expectFileWithContent(distIndex, 'jack');

    clearLogs();
    fs.writeFileSync(envLocalFile, 'PUBLIC_NAME=rose');
    await expectLog('restarting server');
    await expectBuildEnd();
    await expectFileWithContent(distIndex, 'rose');

    close();
  },
);
