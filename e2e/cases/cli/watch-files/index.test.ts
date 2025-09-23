import fs from 'node:fs';
import path from 'node:path';
import { expect, getRandomPort, gotoPage, rspackTest, test } from '@e2e/helper';

const tempConfig = path.join(__dirname, 'test-temp-config.ts');

test.beforeEach(async () => {
  fs.writeFileSync(tempConfig, 'export default 1;');
});

rspackTest(
  'should restart dev server when extra config file changed',
  async ({ page, execCli, logHelper }) => {
    const port = await getRandomPort();
    execCli('dev', {
      env: {
        PORT: String(port),
      },
    });
    const { clearLogs, expectLog, expectBuildEnd } = logHelper;

    // initial build
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
  },
);
