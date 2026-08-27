import { join } from 'node:path';
import type { Rspack } from '@rsbuild/core';
import { expect, test } from '@e2e/helper';

const createDeferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = () => done();
  });
  return { promise, resolve };
};

const createRebuildController = ({
  fatal = false,
  onWatchClose,
}: {
  fatal?: boolean;
  onWatchClose?: () => void;
} = {}) => {
  const started = createDeferred();
  const release = createDeferred();
  const failed = createDeferred();
  const name = fatal ? 'FatalRebuild' : 'BlockingRebuild';
  let armed = false;
  let shouldRun = false;

  return {
    arm: () => {
      armed = true;
    },
    failed,
    plugin: {
      apply(compiler: Rspack.Compiler) {
        compiler.hooks.watchRun.tap(name, () => {
          shouldRun = armed;
        });

        if (fatal) {
          compiler.hooks.failed.tap(name, failed.resolve);
        }

        if (onWatchClose) {
          compiler.hooks.watchClose.tap(name, onWatchClose);
        }

        compiler.hooks.thisCompilation.tap(name, (compilation) => {
          compilation.hooks.processAssets.tapPromise(name, async () => {
            if (!shouldRun) {
              return;
            }

            started.resolve();
            await release.promise;

            if (fatal) {
              throw new Error('intentional fatal watch error');
            }
          });
        });
      },
    },
    release,
    started,
  };
};

test('should respond to requests after a fatal rebuild error', async ({
  copySrcDir,
  devOnly,
  editFile,
}) => {
  const fatal = createRebuildController({ fatal: true });
  const requestQueued = createDeferred();
  const tempSrc = await copySrcDir();
  const entryFile = join(tempSrc, 'index.js');

  const rsbuild = await devOnly({
    config: {
      server: {
        setup: ({ action, server }) => {
          if (action !== 'dev') {
            return;
          }

          server.middlewares.use((req, _res, next) => {
            if (req.headers['x-test-pending-request']) {
              next();
              // The built-in assets middleware queues the request synchronously.
              requestQueued.resolve();
              return;
            }
            next();
          });
        },
      },
      source: {
        entry: {
          index: entryFile,
        },
      },
      tools: {
        rspack(_config, { appendPlugins }) {
          appendPlugins(fatal.plugin);
        },
      },
    },
  });
  const url = `http://localhost:${rsbuild.port}/`;

  expect((await fetch(url)).status).toBe(200);

  fatal.arm();
  await editFile(entryFile, (code) =>
    code.replace('Hello Rsbuild!', 'Hello Rsbuild 2!'),
  );

  await fatal.started.promise;
  const pendingResponse = fetch(url, {
    headers: {
      'x-test-pending-request': 'true',
    },
    signal: AbortSignal.timeout(2_000),
  });
  await requestQueued.promise;
  fatal.release.resolve();
  await fatal.failed.promise;

  expect((await pendingResponse).status).toBe(200);
  expect(
    (
      await fetch(url, {
        signal: AbortSignal.timeout(2_000),
      })
    ).status,
  ).toBe(200);
});

test('should wait for active child compilers after a fatal error', async ({
  copySrcDir,
  devOnly,
  editFile,
}) => {
  let blockingClosed = false;
  const fatal = createRebuildController({ fatal: true });
  const blocking = createRebuildController({
    onWatchClose: () => {
      blockingClosed = true;
    },
  });
  const requestArrived = createDeferred();
  const tempSrc = await copySrcDir();
  const entryFile = join(tempSrc, 'index.js');

  const rsbuild = await devOnly({
    config: {
      dev: {
        assetPrefix: 'auto',
      },
      server: {
        setup: ({ action, server }) => {
          if (action !== 'dev') {
            return;
          }

          server.middlewares.use((req, _res, next) => {
            if (req.url === '/multi-compiler-ready') {
              requestArrived.resolve();
            }
            next();
          });

          return () => {
            server.middlewares.use('/multi-compiler-ready', (_req, res) => {
              res.statusCode = blockingClosed ? 200 : 500;
              res.end();
            });
          };
        },
      },
      source: {
        entry: {
          index: entryFile,
        },
      },
      environments: {
        fatal: {
          output: {
            distPath: 'dist/fatal',
          },
          tools: {
            rspack(_config, { appendPlugins }) {
              appendPlugins(fatal.plugin);
            },
          },
        },
        blocking: {
          output: {
            distPath: 'dist/blocking',
          },
          tools: {
            rspack(_config, { appendPlugins }) {
              appendPlugins(blocking.plugin);
            },
          },
        },
      },
    },
  });

  fatal.arm();
  blocking.arm();
  await editFile(entryFile, (code) =>
    code.replace('Hello Rsbuild!', 'Hello Rsbuild 2!'),
  );
  await Promise.all([fatal.started.promise, blocking.started.promise]);

  fatal.release.resolve();
  await fatal.failed.promise;

  const response = fetch(
    `http://localhost:${rsbuild.port}/multi-compiler-ready`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(2_000),
    },
  );
  await requestArrived.promise;

  blocking.release.resolve();

  expect((await response).status).toBe(200);
  await rsbuild.expectLog('intentional fatal watch error');
});
