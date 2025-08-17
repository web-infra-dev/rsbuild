import fs from 'node:fs';
import path from 'node:path';
import { getRandomPort, gotoPage, rspackOnlyTest, runCli } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { remove } from 'fs-extra';

const distIndex = path.join(__dirname, 'dist/static/js/index.js');
const tempConfig = path.join(__dirname, 'test-temp-config.ts');

test.beforeEach(async () => {
  await remove(distIndex);
  fs.writeFileSync(tempConfig, 'export default 1;');
});

rspackOnlyTest(
  'should restart dev server when extra config file changed',
  async ({ page }) => {
    const port = await getRandomPort();
    const { close, clearLogs, expectLog, expectBuildEnd } = runCli('dev', {
      cwd: __dirname,
      env: {
        ...process.env,
        PORT: String(port),
        NODE_ENV: 'development',
      },
    });

    // the first build
    await expectBuildEnd();
    await gotoPage(page, { port });
    await expect(page.locator('#test')).toHaveText('1');

    // restart dev server
    clearLogs();
    fs.writeFileSync(tempConfig, 'export default 2;');
    await expectLog('restarting server');
    await expectBuildEnd();
    await gotoPage(page, { port });
    await expect(page.locator('#test')).toHaveText('2');
    close();
  },
);
