import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const cwd = __dirname;

const NETWORK_LOG_REGEX =
  /➜\s{2}Network:\s{2}http:\/\/\d{1,3}(?:\.\d{1,3}){3}:\d+/;

test('should print server urls correctly by default', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        htmlFallback: false,
      },
    },
  });

  const url = `http://localhost:${rsbuild.port}/`;
  await page.goto(url);
  expect(await page.evaluate(() => window.test)).toBe(1);

  await rsbuild.expectLog(`➜  Local:    ${url}`);
  await rsbuild.expectLog(NETWORK_LOG_REGEX);

  expect(rsbuild.logs.find((log) => log.includes('/./'))).toBeFalsy();
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

test('should listen only on localhost in dev', async ({ page }) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        host: 'localhost',
        htmlFallback: false,
      },
    },
  });

  const url = `http://localhost:${rsbuild.port}/`;
  await page.goto(url);
  expect(await page.evaluate(() => window.test)).toBe(1);

  await rsbuild.expectLog(`➜  Local:    ${url}`);
  rsbuild.expectNoLog(NETWORK_LOG_REGEX);

  await rsbuild.close();
});

test('should listen only on localhost in preview', async ({ page }) => {
  const rsbuild = await build({
    cwd,
    page,
    rsbuildConfig: {
      server: {
        host: 'localhost',
        htmlFallback: false,
      },
    },
  });

  const url = `http://localhost:${rsbuild.port}/`;
  await page.goto(url);
  expect(await page.evaluate(() => window.test)).toBe(1);

  await rsbuild.expectLog(`➜  Local:    ${url}`);
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

test('should print server urls for multiple web environments with custom distPath.root', async ({
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

test('should print server urls for multiple web environments with custom distPath.html', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        htmlFallback: false,
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

  const url1 = `http://localhost:${rsbuild.port}/html0/`;
  const url2 = `http://localhost:${rsbuild.port}/html1/main`;

  await page.goto(url1);
  expect(await page.evaluate(() => window.test)).toBe(1);

  await page.goto(url2);
  expect(await page.evaluate(() => window.test)).toBe(1);

  await rsbuild.expectLog(`-  index    ${url1}`);
  await rsbuild.expectLog(`-  main     ${url2}`);

  await rsbuild.close();
});

test('should print server urls for web and node environments with custom distPath.root', async ({
  page,
}) => {
  const rsbuild = await dev({
    cwd,
    rsbuildConfig: {
      server: {
        htmlFallback: false,
      },
      environments: {
        web: {
          output: {
            distPath: {
              root: 'dist/client',
            },
          },
        },
        node: {
          output: {
            target: 'node',
            distPath: { root: './dist/server' },
          },
        },
      },
    },
  });

  await page.goto(`http://localhost:${rsbuild.port}`);
  expect(await page.evaluate(() => window.test)).toBe(1);

  await rsbuild.expectLog(`➜  Local:    http://localhost:${rsbuild.port}/`, {
    strict: true,
  });
  await rsbuild.close();
});
