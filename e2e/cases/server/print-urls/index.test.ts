import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

const NETWORK_LOG_REGEX =
  /➜\s{2}Network:\s{2}http:\/\/\d{1,3}(?:\.\d{1,3}){3}:\d+/;

test('should print server urls correctly by default', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
  });

  await page.goto(`http://localhost:${rsbuild.port}`);
  await rsbuild.expectLog(`➜  Local:    http://localhost:${rsbuild.port}/`);
  await rsbuild.expectLog(NETWORK_LOG_REGEX);

  expect(rsbuild.logs.find((log) => log.includes('/./'))).toBeFalsy();
  await rsbuild.close();
});

test('should print different environment server urls correctly', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
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

  await rsbuild.expectLog(
    `-  index    http://localhost:${rsbuild.port}/html0/`,
  );
  await rsbuild.expectLog(
    `-  main     http://localhost:${rsbuild.port}/html1/main`,
  );

  await rsbuild.close();
});

test('should not print server urls when printUrls is false', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        printUrls: false,
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  rsbuild.expectNoLog(`➜  Local:    http://localhost:${rsbuild.port}`);
  rsbuild.expectNoLog(NETWORK_LOG_REGEX);

  await rsbuild.close();
});

test('should allow to custom urls', async ({ page }) => {
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

  rsbuild.expectNoLog(`➜  Local:    http://localhost:${rsbuild.port}`);
  rsbuild.expectNoLog(NETWORK_LOG_REGEX);

  await rsbuild.close();
});

test('should allow to modify and return new urls', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        printUrls: ({ urls }) => urls.map((url) => `${url}/test`),
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  await rsbuild.expectLog(
    `➜  Local:    http://localhost:${rsbuild.port}/test/`,
  );
  rsbuild.expectNoLog(
    /➜\s{2}Network:\s{2}http:\/\/\d{1,3}(?:\.\d{1,3}){3}:\d+\/test\//,
  );

  await rsbuild.close();
});

test('allow only listen to localhost for dev', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        host: 'localhost',
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  await rsbuild.expectLog(`➜  Local:    http://localhost:${rsbuild.port}`);
  rsbuild.expectNoLog(NETWORK_LOG_REGEX);

  await rsbuild.close();
});

test('allow only listen to localhost for prod preview', async ({ page }) => {
  const rsbuild = await build({
    cwd,
    page,
    rsbuildConfig: {
      server: {
        host: 'localhost',
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);

  await rsbuild.expectLog(`➜  Local:    http://localhost:${rsbuild.port}`);
  rsbuild.expectNoLog(NETWORK_LOG_REGEX);

  await rsbuild.close();
});

test('should not print server urls when HTML is disabled', async ({ page }) => {
  const rsbuild = await build({
    cwd,
    page,
    rsbuildConfig: {
      tools: {
        htmlPlugin: false,
      },
    },
  });

  rsbuild.expectNoLog(`➜  Local:    http://localhost:${rsbuild.port}`);
  rsbuild.expectNoLog(NETWORK_LOG_REGEX);

  await rsbuild.close();
});

test('should print server urls when HTML is disabled but printUrls is a custom function', async ({
  page,
}) => {
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

  await rsbuild.expectLog(`➜  Local:    http://localhost:${rsbuild.port}`);
  await rsbuild.close();
});

test('should print server urls for multiple entries as expected', async ({
  page,
}) => {
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

  await rsbuild.expectLog(`➜  Local:`);
  await rsbuild.expectLog(
    `-  index     http://localhost:${rsbuild.port}/dist/`,
  );
  await rsbuild.expectLog(
    `-  index1    http://localhost:${rsbuild.port}/.dist/web1/index1`,
  );

  await rsbuild.close();
});
