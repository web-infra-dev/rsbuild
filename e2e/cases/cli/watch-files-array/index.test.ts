import fs from 'node:fs';
import path from 'node:path';
import { expect, getRandomPort, gotoPage, rspackTest } from '@e2e/helper';

const tempConfig = path.join(__dirname, 'test-temp-config.ts');

rspackTest(
  'should restart dev server when extra config file changed',
  async ({ page, execCli, logHelper }) => {
    fs.writeFileSync(tempConfig, 'export default 1;');

    const port = await getRandomPort();
    execCli('dev', {
      env: {
        PORT: String(port),
      },
    });
    const { expectBuildEnd, expectLog, clearLogs } = logHelper;

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
  },
);
