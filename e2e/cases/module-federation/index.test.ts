import { join } from 'node:path';
import { dev, getRandomPort, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';

const host = join(__dirname, 'host');
const remote = join(__dirname, 'remote');

rspackOnlyTest(
  'should run module federation during development',
  async ({ page }) => {
    const remotePort = await getRandomPort();

    process.env.REMOTE_PORT = remotePort.toString();

    const remoteApp = await dev({
      cwd: remote,
    });
    const hostApp = await dev({
      cwd: host,
    });

    await gotoPage(page, remoteApp);
    await expect(page.locator('#title')).toHaveText('Remote');
    await expect(page.locator('#button')).toHaveText('Button from remote');

    await gotoPage(page, hostApp);
    await expect(page.locator('#title')).toHaveText('Host');
    await expect(page.locator('#button')).toHaveText('Button from remote');

    await hostApp.close();
    await remoteApp.close();
  },
);
