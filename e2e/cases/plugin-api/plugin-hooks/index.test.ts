import { getRandomPort, gotoPage, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import { createRsbuild, type RsbuildPlugin } from '@rsbuild/core';

const createPlugin = () => {
  const names: string[] = [];

  const plugin: RsbuildPlugin = {
    name: 'test-plugin',
    setup(api) {
      api.modifyRspackConfig(() => {
        names.push('ModifyBundlerConfig');
      });
      api.modifyWebpackChain(() => {
        names.push('ModifyBundlerConfig');
      });
      api.modifyRsbuildConfig(() => {
        names.push('ModifyRsbuildConfig');
      });
      api.modifyEnvironmentConfig(() => {
        names.push('ModifyEnvironmentConfig');
      });
      api.modifyBundlerChain(() => {
        names.push('ModifyBundlerChain');
      });
      api.modifyHTML((html) => {
        names.push('ModifyHTML');
        return html;
      });
      api.modifyHTMLTags((tags) => {
        names.push('ModifyHTMLTags');
        return tags;
      });
      api.onBeforeStartDevServer(() => {
        names.push('BeforeStartDevServer');
      });
      api.onAfterStartDevServer(() => {
        names.push('AfterStartDevServer');
      });
      api.onBeforeCreateCompiler(() => {
        names.push('BeforeCreateCompiler');
      });
      api.onAfterCreateCompiler(() => {
        names.push('AfterCreateCompiler');
      });
      api.onBeforeBuild(() => {
        names.push('BeforeBuild');
      });
      api.onBeforeDevCompile(() => {
        names.push('BeforeDevCompile');
      });
      api.onAfterBuild(() => {
        names.push('AfterBuild');
      });
      api.onBeforeEnvironmentCompile(() => {
        names.push('BeforeEnvironmentCompile');
      });
      api.onAfterEnvironmentCompile(() => {
        names.push('AfterEnvironmentCompile');
      });
      api.onBeforeStartProdServer(() => {
        names.push('BeforeStartProdServer');
      });
      api.onCloseDevServer(() => {
        names.push('OnCloseDevServer');
      });
      api.onAfterStartProdServer(() => {
        names.push('AfterStartProdServer');
      });
      api.onDevCompileDone(() => {
        names.push('OnDevCompileDone');
      });
      api.onCloseBuild(() => {
        names.push('OnCloseBuild');
      });
    },
  };

  return { plugin, names };
};

rspackOnlyTest(
  'should run plugin hooks correctly when running build',
  async () => {
    const { plugin, names } = createPlugin();
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

    expect(names).toEqual([
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
      'OnCloseBuild',
    ]);
  },
);

rspackOnlyTest(
  'should run plugin hooks correctly when running build and mode is development',
  async () => {
    const { plugin, names } = createPlugin();
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

    expect(names).toEqual([
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
      'OnCloseBuild',
    ]);
  },
);

rspackOnlyTest(
  'should run plugin hooks correctly when running startDevServer',
  async ({ page }) => {
    process.env.NODE_ENV = 'development';
    const port = await getRandomPort();

    const { plugin, names } = createPlugin();
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

    expect(names.filter((name) => name.includes('DevServer'))).toEqual([
      'BeforeStartDevServer',
      'AfterStartDevServer',
      'OnCloseDevServer',
    ]);

    // compile is async, so the execution order of AfterStartDevServer and the compile hooks is uncertain
    expect(names.filter((name) => name !== 'AfterStartDevServer')).toEqual([
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
      'OnDevCompileDone',
      'OnCloseDevServer',
    ]);

    process.env.NODE_ENV = 'test';
  },
);

rspackOnlyTest(
  'should run plugin hooks correctly when running preview',
  async () => {
    const { plugin, names } = createPlugin();
    const rsbuild = await createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [plugin],
      },
    });

    const result = await rsbuild.preview({
      checkDistDir: false,
    });

    expect(names).toEqual([
      'ModifyRsbuildConfig',
      'ModifyEnvironmentConfig',
      'BeforeStartProdServer',
      'AfterStartProdServer',
    ]);

    await result.server.close();
  },
);
