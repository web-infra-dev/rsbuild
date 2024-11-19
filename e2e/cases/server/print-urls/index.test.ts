import { build, dev, proxyConsole } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

test('should print server urls correctly when printUrls is true', async ({
  page,
}) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        printUrls: true,
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  const localLog = logs.find(
    (log) =>
      log.includes('Local:') &&
      log.includes(`http://localhost:${rsbuild.port}`),
  );
  const networkLog = logs.find(
    (log) => log.includes('Network:') && log.includes('http://'),
  );

  expect(localLog).toBeTruthy();
  expect(networkLog).toBeTruthy();

  expect(logs.find((log) => log.includes('/./'))).toBeFalsy();

  await rsbuild.close();
  restore();
});

test('should print different environment server urls correctly', async ({
  page,
}) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        printUrls: true,
      },
      environments: {
        web: {
          output: {
            distPath: {
              html: 'html0',
            },
          },
        },
        web1: {
          source: {
            entry: {
              main: './src/index.js',
            },
          },
          html: {
            outputStructure: 'nested',
          },
          output: {
            distPath: {
              html: 'html1',
            },
          },
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  const localIndexLog = logs.find(
    (log) => log.includes('Local:') && log.includes('/html0'),
  );

  expect(localIndexLog).toBeTruthy();

  const localMainLog = logs.find(
    (log) => log.includes('Local:') && log.includes('/html1/main'),
  );

  expect(localMainLog).toBeTruthy();

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

test('allow only listen to localhost for dev', async ({ page }) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        host: 'localhost',
        printUrls: true,
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

  expect(localLog).toBeTruthy();
  expect(networkLog).toBeFalsy();

  await rsbuild.close();
  restore();
});

test('allow only listen to localhost for prod preview', async ({ page }) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await build({
    cwd,
    page,
    rsbuildConfig: {
      server: {
        host: 'localhost',
        printUrls: true,
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

  expect(localLog).toBeTruthy();
  expect(networkLog).toBeFalsy();

  await rsbuild.close();
  restore();
});

test('should not print server urls when HTML is disabled', async ({ page }) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await build({
    cwd,
    page,
    rsbuildConfig: {
      tools: {
        htmlPlugin: false,
      },
    },
  });

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

test('should print server urls when HTML is disabled but printUrls is a custom function', async ({
  page,
}) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await build({
    cwd,
    page,
    rsbuildConfig: {
      tools: {
        htmlPlugin: false,
      },
      server: {
        printUrls: ({ port }) => [`http://localhost:${port}`],
      },
    },
  });

  const localLog = logs.find((log) =>
    log.includes(`➜ Network:  http://localhost:${rsbuild.port}`),
  );

  expect(localLog).toBeTruthy();
  await rsbuild.close();
  restore();
});

test('should get posix route correctly', async ({ page }) => {
  const { logs, restore } = proxyConsole('log');

  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        printUrls: ({ urls, routes }) => {
          expect(routes[0].pathname).toBe('/dist/');
          expect(routes[1].pathname).toBe('/.dist/web1/index1');
          return urls;
        },
      },
      environments: {
        web: {},
        web1: {
          source: {
            entry: {
              index1: './src/index.js',
            },
          },
          output: {
            distPath: {
              root: '.dist/web1',
            },
          },
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  const webLog = logs.find((log) =>
    log.includes(`http://localhost:${rsbuild.port}/dist/`),
  );
  const web1Log = logs.find((log) =>
    log.includes(`http://localhost:${rsbuild.port}/.dist/web1/index1`),
  );

  expect(webLog).toBeTruthy();
  expect(web1Log).toBeTruthy();

  await rsbuild.close();
  restore();
});
