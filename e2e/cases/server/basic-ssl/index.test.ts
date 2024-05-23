import { dev, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('print HTTPS server URLs when use @rsbuild/plugin-basic-ssl', async ({
  page,
}) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd,
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  const localLog = logs.find(
    (log) => log.includes('Local:') && log.includes('http2://localhost'),
  );
  const networkLog = logs.find(
    (log) => log.includes('Network:') && log.includes('http2://'),
  );

  expect(localLog).toBeTruthy();
  expect(networkLog).toBeTruthy();

  await rsbuild.close();
  restore();
});
