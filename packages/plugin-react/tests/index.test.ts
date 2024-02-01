import { expect, describe, it, vi } from 'vitest';
import { pluginReact } from '../src';
import { createStubRsbuild } from '@scripts/test-helper';

describe('plugins/react', () => {
  it('should work with swc-loader', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {},
    });

    rsbuild.addPlugins([pluginReact()]);
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
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
          targets: ['node'],
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
          targets: ['web-worker'],
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
});
