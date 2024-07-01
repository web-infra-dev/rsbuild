import fs from 'node:fs';
import path from 'node:path';
import { createRsbuild } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const rsbuildConfig = path.resolve(__dirname, './dist/rsbuild.config.mjs');

const rsbuildEnvironmentWebConfig = path.resolve(
  __dirname,
  './dist/rsbuild.environment-web.config.mjs',
);

const rsbuildEnvironmentNodeConfig = path.resolve(
  __dirname,
  './dist/rsbuild.environment-node.config.mjs',
);
const bundlerConfig = path.resolve(
  __dirname,
  `./dist/${process.env.PROVIDE_TYPE || 'rspack'}.config.web.mjs`,
);
const bundlerNodeConfig = path.resolve(
  __dirname,
  `./dist/${process.env.PROVIDE_TYPE || 'rspack'}.config.node.mjs`,
);

test('should generate config files when writeToDisk is true', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {},
  });
  await rsbuild.inspectConfig({
    writeToDisk: true,
  });

  expect(fs.existsSync(bundlerConfig)).toBeTruthy();
  expect(fs.existsSync(rsbuildConfig)).toBeTruthy();
  expect(fs.existsSync(rsbuildEnvironmentWebConfig)).toBeTruthy();

  fs.rmSync(rsbuildConfig, { force: true });
  fs.rmSync(rsbuildEnvironmentWebConfig, { force: true });
  fs.rmSync(bundlerConfig, { force: true });
});

test('should generate bundler config for node when target contains node', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      environments: {
        web: {
          output: {
            target: 'web',
          },
        },
        node: {
          output: {
            target: 'node',
          },
        },
      },
    },
  });
  await rsbuild.inspectConfig({
    writeToDisk: true,
  });

  expect(fs.existsSync(rsbuildEnvironmentWebConfig)).toBeTruthy();
  expect(fs.existsSync(rsbuildEnvironmentNodeConfig)).toBeTruthy();
  expect(fs.existsSync(bundlerConfig)).toBeTruthy();
  expect(fs.existsSync(bundlerNodeConfig)).toBeTruthy();

  fs.rmSync(rsbuildConfig, { force: true });
  fs.rmSync(rsbuildEnvironmentWebConfig, { force: true });
  fs.rmSync(rsbuildEnvironmentNodeConfig, { force: true });
  fs.rmSync(bundlerConfig, { force: true });
  fs.rmSync(bundlerNodeConfig, { force: true });
});

test('should not generate config files when writeToDisk is false', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {},
  });
  await rsbuild.inspectConfig({
    writeToDisk: false,
  });

  expect(fs.existsSync(rsbuildConfig)).toBeFalsy();
  expect(fs.existsSync(rsbuildEnvironmentWebConfig)).toBeFalsy();
  expect(fs.existsSync(bundlerConfig)).toBeFalsy();
});
