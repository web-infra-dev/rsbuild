import fs from 'node:fs';
import path, { join } from 'node:path';
import { expect, rspackTest, test } from '@e2e/helper';
import type { RsbuildPlugin } from '@rsbuild/core';
import { createRsbuild } from '@rsbuild/core';
import { remove, removeSync } from 'fs-extra';

test.afterAll(() => {
  const files = fs.readdirSync(__dirname);
  for (const file of files) {
    if (file.startsWith('test-temp') || file.startsWith('dist')) {
      removeSync(join(__dirname, file));
    }
  }
});

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

const INSPECT_LOG = 'config inspection completed';

rspackTest(
  'should generate config files when writeToDisk is true',
  async ({ logHelper }) => {
    const { expectLog } = logHelper;

    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });
    await rsbuild.inspectConfig({
      writeToDisk: true,
    });

    expect(fs.existsSync(bundlerConfig)).toBeTruthy();
    expect(fs.existsSync(rsbuildConfig)).toBeTruthy();
    await expectLog(INSPECT_LOG);

    await remove(rsbuildConfig);
    await remove(bundlerConfig);
  },
);

rspackTest(
  'should generate config files correctly when output is specified',
  async ({ logHelper }) => {
    const { expectLog } = logHelper;

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
    await expectLog(INSPECT_LOG);

    await remove(rsbuildConfig);
    await remove(bundlerConfig);
  },
);

rspackTest(
  'should generate bundler config for node when target contains node',
  async ({ logHelper }) => {
    const { expectLog } = logHelper;

    const rsbuild = await createRsbuild({
      cwd: __dirname,
      config: {
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
    await expectLog(INSPECT_LOG);

    await remove(rsbuildConfig);
    await remove(rsbuildNodeConfig);
    await remove(bundlerConfig);
    await remove(bundlerNodeConfig);
  },
);

rspackTest(
  'should not generate config files when writeToDisk is false',
  async () => {
    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });
    await rsbuild.inspectConfig({
      writeToDisk: false,
    });

    expect(fs.existsSync(rsbuildConfig)).toBeFalsy();
    expect(fs.existsSync(bundlerConfig)).toBeFalsy();
  },
);

rspackTest(
  'should allow to specify absolute output path',
  async ({ logHelper }) => {
    const { expectLog } = logHelper;

    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });
    const outputPath = path.join(__dirname, 'test-temp-output');

    await rsbuild.inspectConfig({
      writeToDisk: true,
      outputPath,
    });

    await expectLog(INSPECT_LOG);

    expect(
      fs.existsSync(path.join(outputPath, 'rspack.config.web.mjs')),
    ).toBeTruthy();

    await remove(rsbuildConfig);
  },
);

rspackTest('should generate extra config files', async ({ logHelper }) => {
  const { expectLog } = logHelper;

  const rsbuild = await createRsbuild({
    cwd: __dirname,
  });
  await rsbuild.inspectConfig({
    writeToDisk: true,
    extraConfigs: {
      rstest: {
        include: ['**/*.test.ts'],
      },
    },
  });

  const rstestConfig = path.resolve(
    __dirname,
    './dist/.rsbuild/rstest.config.mjs',
  );

  expect(fs.existsSync(rstestConfig)).toBeTruthy();
  await expectLog('Rstest Config:');
  await remove(rstestConfig);
});

rspackTest('should apply plugin correctly', async () => {
  let servePluginApplied = false;
  let buildPluginApplied = false;

  const servePlugin: RsbuildPlugin = {
    name: 'serve-plugin',
    apply: 'serve',
    setup: () => {
      servePluginApplied = true;
    },
  };

  const buildPlugin: RsbuildPlugin = {
    name: 'build-plugin',
    apply: 'build',
    setup: () => {
      buildPluginApplied = true;
    },
  };

  const rsbuild1 = await createRsbuild({
    cwd: __dirname,
    config: {
      mode: 'development',
      plugins: [servePlugin, buildPlugin],
    },
  });
  await rsbuild1.inspectConfig();

  expect(servePluginApplied).toBe(true);
  expect(buildPluginApplied).toBe(false);

  servePluginApplied = false;

  const rsbuild2 = await createRsbuild({
    cwd: __dirname,
    config: {
      mode: 'production',
      plugins: [servePlugin, buildPlugin],
    },
  });
  await rsbuild2.inspectConfig();

  expect(servePluginApplied).toBe(false);
  expect(buildPluginApplied).toBe(true);
});
