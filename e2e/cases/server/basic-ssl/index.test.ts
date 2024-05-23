import { dev, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('print HTTPS server URLs when use @rsbuild/plugin-basic-ssl', async () => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd,
  });

  await new Promise((resolve) => {
    rsbuild.instance.onDevCompileDone(resolve);
  });

  const localLog = logs.find(
    (log) => log.includes('Local:') && log.includes('https://localhost'),
  );
  const networkLog = logs.find(
    (log) => log.includes('Network:') && log.includes('https://'),
  );

  expect(localLog).toBeTruthy();
  expect(networkLog).toBeTruthy();

  await rsbuild.close();
  restore();
});
