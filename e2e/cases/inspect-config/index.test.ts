import path from 'path';
import { fs } from '@rsbuild/shared/fs-extra';
import { expect, test } from '@playwright/test';
import { createRsbuild } from '@scripts/shared';

const rsbuildConfig = path.resolve(__dirname, './dist/rsbuild.config.js');
const bundlerConfig = path.resolve(
  __dirname,
  `./dist/${process.env.PROVIDE_TYPE || 'rspack'}.config.web.js`,
);
const bundlerNodeConfig = path.resolve(
  __dirname,
  `./dist/${process.env.PROVIDE_TYPE || 'rspack'}.config.node.js`,
);

test('should generate config files when writeToDisk is true', async () => {
  const rsbuild = await createRsbuild(
    {
      cwd: __dirname,
      entry: {
        index: path.resolve(__dirname, './src/index.js'),
      },
    },
    {},
  );
  await rsbuild.inspectConfig({
    writeToDisk: true,
  });

  expect(fs.existsSync(bundlerConfig)).toBeTruthy();
  expect(fs.existsSync(rsbuildConfig)).toBeTruthy();

  fs.removeSync(rsbuildConfig);
  fs.removeSync(bundlerConfig);
});

test('should generate bundler config for node when target contains node', async () => {
  const rsbuild = await createRsbuild(
    {
      cwd: __dirname,
      target: ['web', 'node'],
      entry: {
        index: path.resolve(__dirname, './src/index.js'),
      },
    },
    {},
  );
  await rsbuild.inspectConfig({
    writeToDisk: true,
  });

  expect(fs.existsSync(rsbuildConfig)).toBeTruthy();
  expect(fs.existsSync(bundlerConfig)).toBeTruthy();
  expect(fs.existsSync(bundlerNodeConfig)).toBeTruthy();

  fs.removeSync(rsbuildConfig);
  fs.removeSync(bundlerConfig);
  fs.removeSync(bundlerNodeConfig);
});

test('should not generate config files when writeToDisk is false', async () => {
  const rsbuild = await createRsbuild(
    {
      cwd: __dirname,
      entry: {
        index: path.resolve(__dirname, './src/index.js'),
      },
    },
    {},
  );
  await rsbuild.inspectConfig({
    writeToDisk: false,
  });

  expect(fs.existsSync(rsbuildConfig)).toBeFalsy();
  expect(fs.existsSync(bundlerConfig)).toBeFalsy();
});
