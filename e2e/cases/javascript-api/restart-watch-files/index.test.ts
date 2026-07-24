import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';
import {
  createRsbuild,
  type RestartContext,
  type RsbuildConfig,
  type RsbuildInstance,
} from '@rsbuild/core';
import { getRandomPort } from '@rstackjs/test-utils';

const watchedFile = path.join(import.meta.dirname, 'test-temp-watch.txt');
const watchedDir = path.join(import.meta.dirname, 'test-temp-watch-dir');

const createConfig = (): RsbuildConfig => ({
  dev: {
    watchFiles: {
      paths: watchedFile,
      type: 'restart',
    },
  },
});

const expectRestart = async (rsbuild: RsbuildInstance, action: RestartContext['action']) => {
  let restartContext: RestartContext | undefined;
  let version = 1;

  rsbuild.onRestart((context) => {
    restartContext = context;
  });

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
      action,
      event: 'change',
      filePath: watchedFile,
      options: action === 'build' ? { watch: true } : {},
    });
};

test.beforeEach(() => {
  fs.writeFileSync(watchedFile, '1');
  fs.mkdirSync(watchedDir, { recursive: true });
});

test.afterAll(() => {
  fs.rmSync(watchedFile, { force: true });
  fs.rmSync(watchedDir, { force: true, recursive: true });
});

test('build({ watch: true }) should watch restart files', async ({ build, copySrcDir }) => {
  const sourcePath = await copySrcDir();
  const result = await build({
    watch: true,
    config: {
      ...createConfig(),
      source: {
        entry: {
          index: path.join(sourcePath, 'index.js'),
        },
      },
    },
  });
  await result.expectBuildEnd();

  await expectRestart(result.instance, 'build');

  // Without a restart executor, the current watch build should remain active.
  result.clearLogs();
  fs.writeFileSync(path.join(sourcePath, 'index.js'), "console.log('updated');");
  await result.expectBuildEnd();
});

test('startDevServer() should watch restart files', async ({ devOnly }) => {
  const result = await devOnly({ config: createConfig() });

  await expectRestart(result.instance, 'dev');

  // Without a restart executor, the current server should remain available.
  const response = await fetch(result.urls[0]);
  expect(response.ok).toBeTruthy();
});

test('createDevServer() should watch restart files', async () => {
  const rsbuild = await createRsbuild({
    cwd: import.meta.dirname,
    config: {
      ...createConfig(),
      server: {
        port: await getRandomPort(),
      },
    },
  });
  const server = await rsbuild.createDevServer({ runCompile: false });

  await expectRestart(rsbuild, 'dev');

  await server.close();
});

test('should include a selected restart event in context', async ({ devOnly }) => {
  const result = await devOnly({
    config: {
      dev: {
        watchFiles: {
          paths: watchedDir,
          type: 'restart',
          events: ['add'],
        },
      },
    },
  });

  let restartContext: RestartContext | undefined;
  result.instance.onRestart((context) => {
    restartContext = context;
  });

  let fileIndex = 0;
  await expect
    .poll(
      () => {
        if (!restartContext) {
          fs.writeFileSync(path.join(watchedDir, `added-${++fileIndex}.mdx`), 'added');
        }
        return restartContext;
      },
      { timeout: 5_000 },
    )
    .toMatchObject({
      action: 'dev',
      event: 'add',
      options: {},
    });
});
