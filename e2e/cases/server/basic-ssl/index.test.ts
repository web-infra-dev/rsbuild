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

test('should not print server urls when printUrls is false', async ({
  page,
}) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        printUrls: false,
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  const localLog = logs.find(
    (log) => log.includes('Local:') && log.includes('http://localhost'),
  );
  const networkLog = logs.find(
    (log) => log.includes('Network:') && log.includes('http://'),
  );

  expect(localLog).toBeFalsy();
  expect(networkLog).toBeFalsy();

  await rsbuild.close();
  restore();
});

test('should allow to custom urls', async ({ page }) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        printUrls: ({ urls, protocol, port }) => {
          expect(typeof port).toEqual('number');
          expect(protocol).toEqual('http');
          expect(urls.includes(`http://localhost:${port}`)).toBeTruthy();
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  const localLog = logs.find(
    (log) => log.includes('Local:') && log.includes('http://localhost'),
  );
  const networkLog = logs.find(
    (log) => log.includes('Network:') && log.includes('http://'),
  );

  expect(localLog).toBeFalsy();
  expect(networkLog).toBeFalsy();

  await rsbuild.close();
  restore();
});

test('should allow to modify and return new urls', async ({ page }) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        printUrls: ({ urls }) => urls.map((url) => `${url}/test`),
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  const localLog = logs.find(
    (log) =>
      log.includes('Local:') &&
      log.includes(`http://localhost:${rsbuild.port}/test/`),
  );
  const networkLog = logs.find(
    (log) =>
      log.includes('Network:') &&
      log.includes('http://') &&
      log.endsWith('/test/'),
  );

  expect(localLog).toBeFalsy();
  expect(networkLog).toBeFalsy();

  await rsbuild.close();
  restore();
});
