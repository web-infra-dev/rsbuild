import {
  getRandomPort,
  gotoPage,
  recordPluginHooks,
  rspackOnlyTest,
} from '@e2e/helper';
import { expect } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';

rspackOnlyTest(
  'should run plugin hooks correctly when running build',
  async () => {
    const { plugin, hooks } = recordPluginHooks();
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [plugin],
        performance: {
          printFileSize: false,
        },
      },
    });

    const buildInstance = await rsbuild.build();

    await buildInstance.close();

    expect(hooks).toEqual([
      'ModifyRsbuildConfig',
      'ModifyEnvironmentConfig',
      'ModifyBundlerChain',
      'ModifyBundlerConfig',
      'BeforeCreateCompiler',
      'AfterCreateCompiler',
      'BeforeBuild',
      'BeforeEnvironmentCompile',
      'ModifyHTMLTags',
      'ModifyHTML',
      'AfterEnvironmentCompile',
      'AfterBuild',
      'CloseBuild',
    ]);
  },
);

rspackOnlyTest(
  'should run plugin hooks correctly when running build and mode is development',
  async () => {
    const { plugin, hooks } = recordPluginHooks();
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        mode: 'development',
        plugins: [plugin],
        performance: {
          printFileSize: false,
        },
      },
    });

    const buildInstance = await rsbuild.build();

    await buildInstance.close();

    expect(hooks).toEqual([
      'ModifyRsbuildConfig',
      'ModifyEnvironmentConfig',
      'ModifyBundlerChain',
      'ModifyBundlerConfig',
      'BeforeCreateCompiler',
      'AfterCreateCompiler',
      'BeforeBuild',
      'BeforeEnvironmentCompile',
      'ModifyHTMLTags',
      'ModifyHTML',
      'AfterEnvironmentCompile',
      'AfterBuild',
      'CloseBuild',
    ]);
  },
);

rspackOnlyTest(
  'should run plugin hooks correctly when running startDevServer',
  async ({ page }) => {
    process.env.NODE_ENV = 'development';
    const port = await getRandomPort();

    const { plugin, hooks } = recordPluginHooks();
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [plugin],
        server: {
          port,
        },
      },
    });

    const result = await rsbuild.startDevServer();

    await gotoPage(page, result);

    await result.server.close();

    expect(hooks.filter((name) => name.includes('DevServer'))).toEqual([
      'BeforeStartDevServer',
      'AfterStartDevServer',
      'CloseDevServer',
    ]);

    // compile is async, so the execution order of AfterStartDevServer and the compile hooks is uncertain
    expect(hooks.filter((name) => name !== 'AfterStartDevServer')).toEqual([
      'ModifyRsbuildConfig',
      'ModifyEnvironmentConfig',
      'BeforeStartDevServer',
      'ModifyBundlerChain',
      'ModifyBundlerConfig',
      'BeforeCreateCompiler',
      'AfterCreateCompiler',
      'BeforeDevCompile',
      'BeforeEnvironmentCompile',
      'ModifyHTMLTags',
      'ModifyHTML',
      'AfterEnvironmentCompile',
      'AfterDevCompile',
      'DevCompileDone',
      'CloseDevServer',
    ]);

    process.env.NODE_ENV = 'test';
  },
);

rspackOnlyTest(
  'should run plugin hooks correctly when running preview',
  async () => {
    const { plugin, hooks } = recordPluginHooks();
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [plugin],
      },
    });

    const result = await rsbuild.preview({
      checkDistDir: false,
    });

    expect(hooks).toEqual([
      'ModifyRsbuildConfig',
      'ModifyEnvironmentConfig',
      'BeforeStartProdServer',
      'AfterStartProdServer',
    ]);

    await result.server.close();
  },
);
