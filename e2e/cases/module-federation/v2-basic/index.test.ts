import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  build,
  dev,
  getRandomPort,
  gotoPage,
  rspackOnlyTest,
} from '@e2e/helper';
import { expect } from '@playwright/test';
import type { RsbuildConfig } from '@rsbuild/core';
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

rspackOnlyTest('should run module federation in dev', async ({ page }) => {
  writeButtonCode();

  const remotePort = await getRandomPort();

  process.env.REMOTE_PORT = remotePort.toString();

  const remoteApp = await dev({
    cwd: remote,
  });

  await gotoPage(page, remoteApp);
  await expect(page.locator('#title')).toHaveText('Remote');
  await expect(page.locator('#button')).toHaveText('Button from remote');

  const hostApp = await dev({
    cwd: host,
  });

  await gotoPage(page, hostApp);
  await expect(page.locator('#title')).toHaveText('Host');
  await expect(page.locator('#button')).toHaveText('Button from remote');

  await hostApp.close();
  await remoteApp.close();
});

rspackOnlyTest(
  'should allow remote module to perform HMR',
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

    writeButtonCode('Button from remote (HMR)');
    await expect(page.locator('#button')).toHaveText(
      'Button from remote (HMR)',
    );

    await hostApp.close();
    await remoteApp.close();
  },
);

rspackOnlyTest('should downgrade syntax as expected', async () => {
  writeButtonCode();

  const remotePort = await getRandomPort();

  process.env.REMOTE_PORT = remotePort.toString();

  const rsbuildConfig: RsbuildConfig = {
    output: {
      sourceMap: true,
      overrideBrowserslist: ['Chrome >= 51'],
    },
    performance: {
      chunkSplit: {
        strategy: 'all-in-one',
      },
    },
    plugins: [
      pluginCheckSyntax({
        // MF runtime contains dynamic import, which can not pass syntax checking
        exclude: [/@module-federation[\\/+]runtime/],
      }),
    ],
  };

  await expect(
    build({
      cwd: remote,
      rsbuildConfig,
    }),
  ).resolves.toBeTruthy();

  await expect(
    build({
      cwd: host,
      rsbuildConfig,
    }),
  ).resolves.toBeTruthy();
});
