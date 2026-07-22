import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';
import { createRsbuild, type RestartContext } from '@rsbuild/core';
import { getRandomPort } from '@rstackjs/test-utils';

const watchedFile = path.join(import.meta.dirname, 'test-temp-watch.txt');

test.beforeEach(() => {
  fs.writeFileSync(watchedFile, '1');
});

test.afterAll(() => {
  fs.rmSync(watchedFile, { force: true });
});

test('should preserve startDevServer options after restart', async () => {
  let restartContext: RestartContext | undefined;
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
    restart: (context) => {
      restartContext = context;
      return true;
    },
  });

  const { server } = await rsbuild.startDevServer({ getPortSilently: true });
  let version = 1;

  try {
    await expect
      .poll(
        () => {
          if (!restartContext) {
            fs.writeFileSync(watchedFile, String(++version));
          }
          return restartContext;
        },
        { timeout: 5_000 },
      )
      .toEqual({
        action: 'dev',
        filePath: watchedFile,
        options: {
          getPortSilently: true,
        },
      });
  } finally {
    await server.close();
  }
});

test('should preserve build options after restart', async () => {
  let restartContext: RestartContext | undefined;
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: {
      dev: {
        watchFiles: {
          paths: watchedFile,
          type: 'restart',
        },
      },
    },
    restart: (context) => {
      restartContext = context;
      return true;
    },
  });

  const buildReady = new Promise<void>((resolve) => {
    rsbuild.onAfterBuild(() => resolve());
  });
  const result = await rsbuild.build({ watch: true });
  await buildReady;
  let version = 1;

  try {
    await expect
      .poll(
        () => {
          if (!restartContext) {
            fs.writeFileSync(watchedFile, String(++version));
          }
          return restartContext;
        },
        { timeout: 5_000 },
      )
      .toEqual({
        action: 'build',
        filePath: watchedFile,
        options: {
          watch: true,
        },
      });
  } finally {
    await result.close();
  }
});
