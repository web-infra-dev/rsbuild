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

test('should respond to requests after a fatal rebuild error', async ({
  copySrcDir,
  devOnly,
  editFile,
}) => {
  const rebuildStarted = createDeferred();
  const requestQueued = createDeferred();
  const triggerFatalError = createDeferred();
  let compileCount = 0;
  let shouldThrow = false;

  const tempSrc = await copySrcDir();
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
          index: join(tempSrc, 'index.js'),
        },
      },
      tools: {
        rspack(_config, { appendPlugins }) {
          appendPlugins({
            apply(compiler: Rspack.Compiler) {
              compiler.hooks.watchRun.tap('ThrowOnFirstRebuild', () => {
                compileCount++;
                shouldThrow = compileCount === 2;
              });

              compiler.hooks.thisCompilation.tap(
                'ThrowOnFirstRebuild',
                (compilation) => {
                  compilation.hooks.processAssets.tapPromise(
                    'ThrowOnFirstRebuild',
                    async () => {
                      if (!shouldThrow) {
                        return;
                      }

                      rebuildStarted.resolve();
                      await triggerFatalError.promise;
                      throw new Error('intentional fatal watch error');
                    },
                  );
                },
              );
            },
          });
        },
      },
    },
  });
  const url = `http://localhost:${rsbuild.port}/`;

  const initialResponse = await fetch(url);
  expect(initialResponse.status).toBe(200);

  rsbuild.clearLogs();
  await editFile(join(tempSrc, 'index.js'), (code) =>
    code.replace('Hello Rsbuild!', 'Hello Rsbuild 2!'),
  );

  await rebuildStarted.promise;
  const pendingResponse = fetch(url, {
    headers: {
      'x-test-pending-request': 'true',
    },
    signal: AbortSignal.timeout(2_000),
  });
  await requestQueued.promise;
  triggerFatalError.resolve();
  await rsbuild.expectLog('intentional fatal watch error');

  expect((await pendingResponse).status).toBe(200);

  const subsequentResponse = await fetch(url, {
    signal: AbortSignal.timeout(2_000),
  });
  expect(subsequentResponse.status).toBe(200);
});
