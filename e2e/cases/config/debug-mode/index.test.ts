import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';
import { logger } from '@rsbuild/core';

const getRsbuildConfig = (dist: string) =>
  path.resolve(__dirname, `./${dist}/.rsbuild/rsbuild.config.mjs`);

const getBundlerConfig = (dist: string) =>
  path.resolve(
    __dirname,
    `./${dist}/.rsbuild/${process.env.PROVIDE_TYPE || 'rspack'}.config.web.mjs`,
  );

test('should generate config files in debug mode when build', async ({
  build,
}) => {
  const { level } = logger;
  logger.level = 'verbose';
  process.env.DEBUG = 'rsbuild';

  const distRoot = 'dist-1';
  const rsbuild = await build({
    rsbuildConfig: {
      output: {
        distPath: {
          root: distRoot,
        },
      },
    },
  });

  expect(fs.existsSync(getRsbuildConfig(distRoot))).toBeTruthy();
  expect(fs.existsSync(getBundlerConfig(distRoot))).toBeTruthy();

  await rsbuild.expectLog('config inspection completed');
  await rsbuild.expectLog('creating compiler');

  delete process.env.DEBUG;
  logger.level = level;
});

test('should generate config files in debug mode when dev', async ({
  page,
  dev,
}) => {
  const { level } = logger;
  process.env.DEBUG = 'rsbuild';
  logger.level = 'verbose';

  const distRoot = 'dist-2';
  const rsbuild = await dev({
    rsbuildConfig: {
      output: {
        distPath: {
          root: distRoot,
        },
      },
    },
    page,
  });

  expect(fs.existsSync(getRsbuildConfig(distRoot))).toBeTruthy();
  expect(fs.existsSync(getBundlerConfig(distRoot))).toBeTruthy();

  await rsbuild.expectLog('config inspection completed');
  await rsbuild.expectLog('creating compiler');

  delete process.env.DEBUG;
  logger.level = level;
});
