import { build, webpackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { logger } from '@rsbuild/core';

webpackOnlyTest('should emit progress log in non-TTY environment', async () => {
  process.stdout.isTTY = false;

  const { info, ready } = logger;
  const infoMsgs: any[] = [];
  const readyMsgs: any[] = [];

  logger.info = (message) => {
    infoMsgs.push(message);
  };
  logger.ready = (message) => {
    readyMsgs.push(message);
  };

  await build({
    cwd: __dirname,
    rsbuildConfig: {
      dev: {
        progressBar: true,
      },
    },
  });

  expect(
    infoMsgs.some((message) => message.includes('build progress')),
  ).toBeTruthy();
  expect(readyMsgs.some((message) => message.includes('built'))).toBeTruthy();

  process.stdout.isTTY = true;
  logger.info = info;
  logger.ready = ready;
});
