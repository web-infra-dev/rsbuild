import { createStubRsbuild, matchRules } from '@scripts/test-helper';
import { describe, expect, it } from 'vitest';
import { pluginReact } from '../src';

describe('plugins/react', () => {
  it('should work with swc-loader', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        mode: 'development',
      },
    });

    rsbuild.addPlugins([pluginReact()]);
    const config = await rsbuild.unwrapConfig();

    expect(matchRules(config, 'a.js')).toMatchSnapshot();
  });

  it('should configuring `tools.swc` to override react runtime', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        mode: 'development',
        tools: {
          swc: {
            jsc: {
              transform: {
                react: {
                  runtime: 'classic',
                },
              },
            },
          },
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);
    const config = await rsbuild.unwrapConfig();

    expect(matchRules(config, 'a.js')).toMatchSnapshot();
  });

  it('should not apply react refresh when dev.hmr is false', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        dev: {
          hmr: false,
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    expect(await rsbuild.matchBundlerPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        output: {
          target: 'node',
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    expect(await rsbuild.matchBundlerPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        output: {
          target: 'web-worker',
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    expect(await rsbuild.matchBundlerPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply splitChunks rule when strategy is not split-by-experience', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        performance: {
          chunkSplit: {
            strategy: 'single-vendor',
          },
        },
      },
    });

    rsbuild.addPlugins([pluginReact()]);

    const config = await rsbuild.unwrapConfig();

    expect(config.optimization.splitChunks).toMatchSnapshot();
  });

  it('should allow to custom jsxImportSource', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
    });

    rsbuild.addPlugins([
      pluginReact({
        swcReactOptions: {
          importSource: '@emotion/react',
        },
      }),
    ]);
    const config = await rsbuild.unwrapConfig();

    expect(JSON.stringify(config)).toContain(`"importSource":"@emotion/react"`);
  });

  it('should allow to add react plugin as single environment plugin', async () => {
    process.env.NODE_ENV = 'production';

    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        environments: {
          web: {},
          web1: {},
        },
      },
    });

    rsbuild.addPlugins(
      [
        pluginReact({
          enableProfiler: true,
        }),
      ],
      {
        environment: 'web',
      },
    );
    const { bundlerConfigs, environmentConfigs } =
      await rsbuild.inspectConfig();

    expect(bundlerConfigs[0]).toContain('lib-react');
    expect(environmentConfigs[0]).toContain('keep_classnames');

    expect(bundlerConfigs[1]).not.toContain('lib-react');
    expect(environmentConfigs[1]).not.toContain('keep_classnames');

    delete process.env.NODE_ENV;
  });
});
