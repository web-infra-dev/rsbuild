import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  build,
  dev,
  getRandomPort,
  gotoPage,
  rspackOnlyTest,
} from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { pluginCheckSyntax } from '@rsbuild/plugin-check-syntax';

const host = join(__dirname, 'host');
const remote = join(__dirname, 'remote');

const writeButtonCode = (text = 'Button from remote') => {
  writeFileSync(
    join(__dirname, 'remote/src/test-temp-Button.tsx'),
    `const Button = () => (
  <button type="button" id="button">
    ${text}
  </button>
);
export default Button;`,
  );
};

rspackOnlyTest(
  'should run module federation in development mode',
  async ({ page }) => {
    writeButtonCode();

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
  'should run module federation in development mode with server.base',
  async ({ page }) => {
    writeButtonCode();

    const remotePort = await getRandomPort();

    process.env.REMOTE_PORT = remotePort.toString();

    const remoteApp = await dev({
      cwd: remote,
      rsbuildConfig: {
        server: {
          base: '/remote',
        },
      },
    });
    const hostApp = await dev({
      cwd: host,
      rsbuildConfig: {
        server: {
          base: '/host',
        },
      },
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
  'should allow remote module to perform HMR',
  async ({ page }) => {
    // HMR cases will fail in Windows
    if (process.platform === 'win32') {
      test.skip();
    }

    writeButtonCode();

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

    writeButtonCode('Button from remote (HMR)');
    await expect(page.locator('#button')).toHaveText(
      'Button from remote (HMR)',
    );

    await hostApp.close();
    await remoteApp.close();
  },
);

rspackOnlyTest(
  'should transform module federation runtime with SWC',
  async () => {
    writeButtonCode();

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
