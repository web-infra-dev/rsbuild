import fs from 'node:fs';
import path from 'node:path';
import { createRsbuild } from '@e2e/helper';
import { expect, test } from '@playwright/test';

const rsbuildConfig = path.resolve(
  __dirname,
  './dist/.rsbuild/rsbuild.config.mjs',
);

const rsbuildNodeConfig = path.resolve(
  __dirname,
  './dist/.rsbuild/rsbuild.config.node.mjs',
);
const bundlerConfig = path.resolve(
  __dirname,
  `./dist/.rsbuild/${process.env.PROVIDE_TYPE || 'rspack'}.config.web.mjs`,
);
const bundlerNodeConfig = path.resolve(
  __dirname,
  `./dist/.rsbuild/${process.env.PROVIDE_TYPE || 'rspack'}.config.node.mjs`,
);

test('should generate config files when writeToDisk is true', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
  });
  await rsbuild.inspectConfig({
    writeToDisk: true,
  });

  expect(fs.existsSync(bundlerConfig)).toBeTruthy();
  expect(fs.existsSync(rsbuildConfig)).toBeTruthy();

  fs.rmSync(rsbuildConfig, { force: true });
  fs.rmSync(bundlerConfig, { force: true });
});

test('should generate config files correctly when output is specified', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
  });
  await rsbuild.inspectConfig({
    writeToDisk: true,
    outputPath: 'foo',
  });

  const bundlerConfig = path.resolve(
    __dirname,
    `./dist/foo/${process.env.PROVIDE_TYPE || 'rspack'}.config.web.mjs`,
  );

  const rsbuildConfig = path.resolve(
    __dirname,
    './dist/foo/rsbuild.config.mjs',
  );

  expect(fs.existsSync(bundlerConfig)).toBeTruthy();
  expect(fs.existsSync(rsbuildConfig)).toBeTruthy();

  fs.rmSync(rsbuildConfig, { force: true });
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

  expect(fs.existsSync(rsbuildNodeConfig)).toBeTruthy();
  expect(fs.existsSync(bundlerConfig)).toBeTruthy();
  expect(fs.existsSync(bundlerNodeConfig)).toBeTruthy();

  fs.rmSync(rsbuildConfig, { force: true });
  fs.rmSync(rsbuildNodeConfig, { force: true });
  fs.rmSync(bundlerConfig, { force: true });
  fs.rmSync(bundlerNodeConfig, { force: true });
});

test('should not generate config files when writeToDisk is false', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
  });
  await rsbuild.inspectConfig({
    writeToDisk: false,
  });

  expect(fs.existsSync(rsbuildConfig)).toBeFalsy();
  expect(fs.existsSync(bundlerConfig)).toBeFalsy();
});

test('should allow to specify absolute output path', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
  });
  const outputPath = path.join(__dirname, 'test-temp-output');

  await rsbuild.inspectConfig({
    writeToDisk: true,
    outputPath,
  });

  expect(
    fs.existsSync(path.join(outputPath, 'rspack.config.web.mjs')),
  ).toBeTruthy();

  fs.rmSync(rsbuildConfig, { force: true });
});
