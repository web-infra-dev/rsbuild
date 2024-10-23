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
  process.env.DEBUG = 'rsbuild';
  logger.level = 'verbose';

  const distRoot = 'dist-1';

  await build({
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

  delete process.env.DEBUG;
  logger.level = 'log';
});

test('should generate config files when dev (with DEBUG)', async ({ page }) => {
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

  delete process.env.DEBUG;
  logger.level = 'log';

  await rsbuild.close();
});
