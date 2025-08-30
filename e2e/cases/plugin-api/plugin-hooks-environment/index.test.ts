import { build, dev, rspackOnlyTest } from '@e2e/helper';
import { expect } from '@playwright/test';
import type { RsbuildPlugin } from '@rsbuild/core';

const createPlugin = () => {
  const names: string[] = [];

  const plugin: RsbuildPlugin = {
    name: 'test-plugin',
    setup(api) {
      api.modifyRspackConfig((_config, { environment }) => {
        names.push(`ModifyBundlerConfig ${environment.name}`);
      });
      api.modifyWebpackChain((_config, { environment }) => {
        names.push(`ModifyBundlerConfig ${environment.name}`);
      });
      api.modifyRsbuildConfig(() => {
        names.push('ModifyRsbuildConfig');
      });
      api.modifyEnvironmentConfig((_config, { name }) => {
        names.push(`ModifyEnvironmentConfig ${name}`);
      });
      api.modifyBundlerChain((_chain, { environment }) => {
        names.push(`ModifyBundlerChain ${environment.name}`);
      });
      api.modifyHTML((html, { environment }) => {
        names.push(`ModifyHTML ${environment.name}`);
        return html;
      });
      api.modifyHTMLTags((tags, { environment }) => {
        names.push(`ModifyHTMLTags ${environment.name}`);
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
      api.onAfterBuild(() => {
        names.push('AfterBuild');
      });
      api.onBeforeEnvironmentCompile(({ environment }) => {
        names.push(`BeforeEnvironmentCompile ${environment.name}`);
      });
      api.onAfterEnvironmentCompile(({ stats, environment }) => {
        expect(stats?.compilation.name).toBe(environment.name);
        names.push(`AfterEnvironmentCompile ${environment.name}`);
      });
      api.onBeforeStartProdServer(() => {
        names.push('BeforeStartProdServer');
      });
      api.onCloseDevServer(() => {
        names.push('CloseDevServer');
      });
      api.onAfterStartProdServer(() => {
        names.push('AfterStartProdServer');
      });
      api.onBeforeDevCompile(() => {
        names.push('BeforeDevCompile');
      });
      api.onAfterDevCompile(() => {
        names.push('AfterDevCompile');
      });
      api.onDevCompileDone(() => {
        names.push('DevCompileDone');
      });
    },
  };

  return { plugin, names };
};

rspackOnlyTest(
  'should run plugin hooks correctly when running build with multiple environments',
  async () => {
    process.env.NODE_ENV = 'production';
    const { plugin, names } = createPlugin();
    const rsbuild = await build({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [plugin],
        environments: {
          web: {},
          node: {},
        },
      },
    });

    // Test environment hook is always called twice
    expect(names.filter((name) => name.includes(' web')).length).toBe(
      names.filter((name) => name.includes(' node')).length,
    );

    // The execution order between different Environments of the same hook is not fixed
    // Therefore, we only test the execution order of a single Environment
    expect(names.filter((name) => !name.includes(' node'))).toEqual([
      'ModifyRsbuildConfig',
      'ModifyEnvironmentConfig web',
      'ModifyBundlerChain web',
      'ModifyBundlerConfig web',
      'BeforeCreateCompiler',
      'AfterCreateCompiler',
      'BeforeBuild',
      'BeforeEnvironmentCompile web',
      'ModifyHTMLTags web',
      'ModifyHTML web',
      'AfterEnvironmentCompile web',
      'AfterBuild',
    ]);

    expect(names.filter((name) => !name.includes(' web'))).toEqual([
      'ModifyRsbuildConfig',
      'ModifyEnvironmentConfig node',
      'ModifyBundlerChain node',
      'ModifyBundlerConfig node',
      'BeforeCreateCompiler',
      'AfterCreateCompiler',
      'BeforeBuild',
      'BeforeEnvironmentCompile node',
      'ModifyHTMLTags node',
      'ModifyHTML node',
      'AfterEnvironmentCompile node',
      'AfterBuild',
    ]);

    await rsbuild.close();
    process.env.NODE_ENV = 'test';
  },
);

rspackOnlyTest(
  'should run plugin hooks correctly when running startDevServer with multiple environments',
  async ({ page }) => {
    process.env.NODE_ENV = 'development';

    const { plugin, names } = createPlugin();
    const rsbuild = await dev({
      cwd: __dirname,
      page,
      rsbuildConfig: {
        plugins: [plugin],
        environments: {
          web: {},
          node: {},
        },
      },
    });

    await rsbuild.close();

    expect(names.filter((name) => name.includes(' web')).length).toBe(
      names.filter((name) => name.includes(' node')).length,
    );

    expect(names.filter((name) => name.includes('DevServer'))).toEqual([
      'BeforeStartDevServer',
      'AfterStartDevServer',
      'CloseDevServer',
    ]);

    // compile is async, so the execution order of AfterStartDevServer and the compile hooks is uncertain
    expect(
      names.filter(
        (name) => !name.includes(' node') && name !== 'AfterStartDevServer',
      ),
    ).toEqual([
      'ModifyRsbuildConfig',
      'ModifyEnvironmentConfig web',
      'BeforeStartDevServer',
      'ModifyBundlerChain web',
      'ModifyBundlerConfig web',
      'BeforeCreateCompiler',
      'AfterCreateCompiler',
      'BeforeDevCompile',
      'BeforeEnvironmentCompile web',
      'ModifyHTMLTags web',
      'ModifyHTML web',
      'AfterEnvironmentCompile web',
      'AfterDevCompile',
      'DevCompileDone',
      'CloseDevServer',
    ]);

    expect(
      names.filter(
        (name) => !name.includes(' web') && name !== 'AfterStartDevServer',
      ),
    ).toEqual([
      'ModifyRsbuildConfig',
      'ModifyEnvironmentConfig node',
      'BeforeStartDevServer',
      'ModifyBundlerChain node',
      'ModifyBundlerConfig node',
      'BeforeCreateCompiler',
      'AfterCreateCompiler',
      'BeforeDevCompile',
      'BeforeEnvironmentCompile node',
      'ModifyHTMLTags node',
      'ModifyHTML node',
      'AfterEnvironmentCompile node',
      'AfterDevCompile',
      'DevCompileDone',
      'CloseDevServer',
    ]);

    process.env.NODE_ENV = 'test';
  },
);
