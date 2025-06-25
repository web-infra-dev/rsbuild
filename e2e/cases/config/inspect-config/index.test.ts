import fs from 'node:fs';
import path, { join } from 'node:path';
import { createRsbuild, proxyConsole, rspackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
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

rspackOnlyTest(
  'should generate config files when writeToDisk is true',
  async () => {
    const { logs, restore } = proxyConsole();

    const rsbuild = await createRsbuild({
      cwd: __dirname,
    });
    await rsbuild.inspectConfig({
      writeToDisk: true,
    });

    expect(fs.existsSync(bundlerConfig)).toBeTruthy();
    expect(fs.existsSync(rsbuildConfig)).toBeTruthy();

    expect(
      logs.some((log) => log.includes('config inspection completed')),
    ).toBeTruthy();

    await remove(rsbuildConfig);
    await remove(bundlerConfig);

    restore();
  },
);

rspackOnlyTest(
  'should generate config files correctly when output is specified',
  async () => {
    const { logs, restore } = proxyConsole();

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

    expect(
      logs.some((log) => log.includes('config inspection completed')),
    ).toBeTruthy();

    await remove(rsbuildConfig);
    await remove(bundlerConfig);

    restore();
  },
);

rspackOnlyTest(
  'should generate bundler config for node when target contains node',
  async () => {
    const { logs, restore } = proxyConsole();

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

    expect(
      logs.some((log) => log.includes('config inspection completed')),
    ).toBeTruthy();

    await remove(rsbuildConfig);
    await remove(rsbuildNodeConfig);
    await remove(bundlerConfig);
    await remove(bundlerNodeConfig);

    restore();
  },
);

rspackOnlyTest(
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

rspackOnlyTest('should allow to specify absolute output path', async () => {
  const { logs, restore } = proxyConsole();

  const rsbuild = await createRsbuild({
    cwd: __dirname,
  });
  const outputPath = path.join(__dirname, 'test-temp-output');

  await rsbuild.inspectConfig({
    writeToDisk: true,
    outputPath,
  });

  expect(
    logs.some((log) => log.includes('config inspection completed')),
  ).toBeTruthy();

  expect(
    fs.existsSync(path.join(outputPath, 'rspack.config.web.mjs')),
  ).toBeTruthy();

  await remove(rsbuildConfig);

  restore();
});

rspackOnlyTest('should generate extra config files', async () => {
  const { logs, restore } = proxyConsole();

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

  expect(logs.some((log) => log.includes('Rstest Config:'))).toBeTruthy();

  await remove(rstestConfig);

  restore();
});
