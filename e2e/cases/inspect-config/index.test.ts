import path from 'path';
import { fse } from '@rsbuild/shared';
import { expect, test } from '@playwright/test';
import { createRsbuild } from '@e2e/helper';

const rsbuildConfig = path.resolve(__dirname, './dist/rsbuild.config.mjs');
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

  expect(fse.existsSync(bundlerConfig)).toBeTruthy();
  expect(fse.existsSync(rsbuildConfig)).toBeTruthy();

  fse.removeSync(rsbuildConfig);
  fse.removeSync(bundlerConfig);
});

test('should generate bundler config for node when target contains node', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      output: {
        targets: ['web', 'node'],
      },
    },
  });
  await rsbuild.inspectConfig({
    writeToDisk: true,
  });

  expect(fse.existsSync(rsbuildConfig)).toBeTruthy();
  expect(fse.existsSync(bundlerConfig)).toBeTruthy();
  expect(fse.existsSync(bundlerNodeConfig)).toBeTruthy();

  fse.removeSync(rsbuildConfig);
  fse.removeSync(bundlerConfig);
  fse.removeSync(bundlerNodeConfig);
});

test('should not generate config files when writeToDisk is false', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {},
  });
  await rsbuild.inspectConfig({
    writeToDisk: false,
  });

  expect(fse.existsSync(rsbuildConfig)).toBeFalsy();
  expect(fse.existsSync(bundlerConfig)).toBeFalsy();
});
