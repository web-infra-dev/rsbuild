import { expect, recordPluginHooks, rspackTest } from '@e2e/helper';
import { createRsbuild } from '@rsbuild/core';

rspackTest(
  'should run plugin hooks correctly when running build',
  async ({ build }) => {
    const { plugin, hooks } = recordPluginHooks();
    const rsbuild = await build({
      rsbuildConfig: {
        plugins: [plugin],
      },
    });

    await rsbuild.close();

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

rspackTest(
  'should run plugin hooks correctly when running build and mode is development',
  async ({ build }) => {
    const { plugin, hooks } = recordPluginHooks();
    const rsbuild = await build({
      rsbuildConfig: {
        mode: 'development',
        plugins: [plugin],
      },
    });

    await rsbuild.close();

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

rspackTest(
  'should run plugin hooks correctly when running startDevServer',
  async ({ dev }) => {
    process.env.NODE_ENV = 'development';

    const { plugin, hooks } = recordPluginHooks();
    const rsbuild = await dev({
      rsbuildConfig: {
        plugins: [plugin],
      },
    });

    await rsbuild.close();

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

rspackTest(
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

    await result.server.close();

    expect(hooks).toEqual([
      'ModifyRsbuildConfig',
      'ModifyEnvironmentConfig',
      'BeforeStartProdServer',
      'AfterStartProdServer',
    ]);
  },
);
