import path from 'node:path';
import { build, dev, gotoPage } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { logger } from '@rsbuild/core';
import { fse } from '@rsbuild/shared';

const getRsbuildConfig = (dist: string) =>
  path.resolve(__dirname, `./${dist}/rsbuild.config.mjs`);
const getBundlerConfig = (dist: string) =>
  path.resolve(
    __dirname,
    `./${dist}/${process.env.PROVIDE_TYPE || 'rspack'}.config.web.mjs`,
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

  expect(fse.existsSync(getRsbuildConfig(distRoot))).toBeTruthy();
  expect(fse.existsSync(getBundlerConfig(distRoot))).toBeTruthy();

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

  expect(fse.existsSync(getRsbuildConfig(distRoot))).toBeTruthy();
  expect(fse.existsSync(getBundlerConfig(distRoot))).toBeTruthy();

  delete process.env.DEBUG;
  logger.level = 'log';

  await rsbuild.close();
});
