import { join } from 'node:path';
import {
  getRandomPort,
  gotoPage,
  proxyConsole,
  rspackOnlyTest,
} from '@e2e/helper';
import { expect } from '@playwright/test';
import { createRsbuild, type RsbuildPlugin } from '@rsbuild/core';
import fse from 'fs-extra';

const createPlugin = () => {
  const names: string[] = [];

  const plugin: RsbuildPlugin = {
    name: 'test-plugin',
    setup(api) {
      api.onBeforeEnvironmentCompile(({ environment }) => {
        names.push(`BeforeEnvironmentCompile ${environment.name}`);
      });
      api.onBeforeDevCompile(() => {
        names.push('BeforeDevCompile');
      });
    },
  };

  return { plugin, names };
};

rspackOnlyTest(
  'should run onBeforeDevCompile hook correctly when rebuild in dev with multiple environments',
  async ({ page }) => {
    process.env.NODE_ENV = 'development';
    const cwd = __dirname;
    const filePath = join(cwd, 'test-temp-src', 'index.js');
    await fse.outputFile(filePath, "console.log('1');");

    const port = await getRandomPort();

    const { plugin, names } = createPlugin();

    const { expectLog, restore, expectBuildEnd } = proxyConsole();

    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [plugin],
        server: {
          port,
        },
        environments: {
          web: {},
          node: {
            source: {
              entry: {
                index: './test-temp-src/index.js',
              },
            },
          },
        },
        performance: {
          printFileSize: false,
        },
      },
    });

    const result = await rsbuild.startDevServer();

    await gotoPage(page, result);

    expect(names.includes('BeforeDevCompile')).toBeTruthy();
    expect(names.includes('BeforeEnvironmentCompile node')).toBeTruthy();
    expect(names.includes('BeforeEnvironmentCompile web')).toBeTruthy();

    names.length = 0;

    // rebuild
    await fse.outputFile(filePath, "console.log('2');");
    await expectLog('building test-temp-src');
    await expectBuildEnd();

    expect(names).toEqual([
      'BeforeDevCompile',
      // only recompile the node environment which is affected by the file change
      'BeforeEnvironmentCompile node',
    ]);

    await result.server.close();

    restore();

    process.env.NODE_ENV = 'test';
  },
);
