import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';
import { createRsbuild, type RestartContext, type RestartFn } from '@rsbuild/core';
import { getRandomPort } from '@rstackjs/test-utils';

const watchedFile = path.join(import.meta.dirname, 'test-temp-watch.txt');

test.beforeAll(() => {
  fs.writeFileSync(watchedFile, '1');
});

test.afterAll(() => {
  fs.rmSync(watchedFile, { force: true });
});

test('createRsbuild should support a restart function', async () => {
  const calls: string[] = [];
  let restartResult:
    | {
        context: RestartContext;
        calls: string[];
      }
    | undefined;

  const restart: RestartFn = (context) => {
    restartResult = { context, calls: [...calls] };
    return true;
  };

  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: {
      dev: {
        watchFiles: {
          paths: watchedFile,
          type: 'restart',
        },
      },
      server: {
        port: await getRandomPort(),
      },
    },
    restart,
  });

  rsbuild.onRestart(() => {
    calls.push('onRestart');
  });
  rsbuild.onCloseDevServer(() => {
    calls.push('onCloseDevServer');
  });

  const server = await rsbuild.createDevServer({ runCompile: false });
  let version = 1;

  await expect
    .poll(
      () => {
        if (!restartResult) {
          fs.writeFileSync(watchedFile, String(++version));
        }
        return restartResult;
      },
      { timeout: 5_000 },
    )
    .toEqual({
      context: {
        action: 'dev',
        filePath: watchedFile,
        options: {},
      },
      calls: ['onRestart', 'onCloseDevServer'],
    });

  await server.close();
});
