import fs from 'node:fs';
import path from 'node:path';
import { build, dev, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { logger } from '@rsbuild/core';

const getRsbuildConfig = (dist: string) =>
  path.resolve(__dirname, `./${dist}/.rsbuild/rsbuild.config.mjs`);

const getBundlerConfig = (dist: string) =>
  path.resolve(
    __dirname,
    `./${dist}/.rsbuild/${process.env.PROVIDE_TYPE || 'rspack'}.config.web.mjs`,
  );

test('should generate config files when build (with DEBUG)', async () => {
  const { level } = logger;
  logger.level = 'verbose';
  process.env.DEBUG = 'rsbuild';

  const distRoot = 'dist-1';
  const { logs, close } = await build({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        distPath: {
          root: distRoot,
        },
        cleanDistPath: true,
      },
    },
  });

  expect(fs.existsSync(getRsbuildConfig(distRoot))).toBeTruthy();
  expect(fs.existsSync(getBundlerConfig(distRoot))).toBeTruthy();

  expect(
    logs.some((log) => log.includes('config inspection completed')),
  ).toBeTruthy();

  expect(logs.some((log) => log.includes('create compiler'))).toBeTruthy();

  delete process.env.DEBUG;
  logger.level = level;
  await close();
});

test('should generate config files when dev (with DEBUG)', async ({ page }) => {
  const { level } = logger;
  process.env.DEBUG = 'rsbuild';
  logger.level = 'verbose';

  const distRoot = 'dist-2';
  const rsbuild = await dev({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        distPath: {
          root: distRoot,
        },
        cleanDistPath: true,
      },
    },
  });

  const res = await gotoPage(page, rsbuild);

  expect(res?.status()).toBe(200);

  expect(fs.existsSync(getRsbuildConfig(distRoot))).toBeTruthy();
  expect(fs.existsSync(getBundlerConfig(distRoot))).toBeTruthy();

  expect(
    rsbuild.logs.some((log) => log.includes('config inspection completed')),
  ).toBeTruthy();

  expect(
    rsbuild.logs.some((log) => log.includes('create compiler')),
  ).toBeTruthy();

  delete process.env.DEBUG;
  logger.level = level;
  await rsbuild.close();
});
