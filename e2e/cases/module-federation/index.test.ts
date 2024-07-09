import { join } from 'node:path';
import {
  build,
  dev,
  getRandomPort,
  gotoPage,
  rspackOnlyTest,
} from '@e2e/helper';
import { expect } from '@playwright/test';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';

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

rspackOnlyTest(
  'should transform module federation runtime with SWC',
  async () => {
    const remotePort = await getRandomPort();

    process.env.REMOTE_PORT = remotePort.toString();

    await expect(
      build({
        cwd: remote,
        rsbuildConfig: {
          output: {
            overrideBrowserslist: ['Chrome >= 51'],
          },
          performance: {
            chunkSplit: {
              strategy: 'all-in-one',
            },
          },
          plugins: [pluginCheckSyntax()],
        },
      }),
    ).resolves.toBeTruthy();

    await expect(
      build({
        cwd: host,
        rsbuildConfig: {
          output: {
            overrideBrowserslist: ['Chrome >= 51'],
          },
          performance: {
            chunkSplit: {
              strategy: 'all-in-one',
            },
          },
          plugins: [pluginCheckSyntax()],
        },
      }),
    ).resolves.toBeTruthy();
  },
);
