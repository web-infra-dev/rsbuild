import { expect, describe, it } from 'vitest';
import { pluginReact } from '../src';
import { webpackProvider } from '@rsbuild/webpack';
import { pluginBabel } from '@rsbuild/webpack/plugin-babel';
import { createStubRsbuild } from '@rsbuild/test-helper';

describe('plugins/react', () => {
  it('should work with babel-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel(), pluginReact()],
      provider: webpackProvider,
      rsbuildConfig: {},
    });
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should work with ts-loader', async () => {
    const rsbuild = await createStubRsbuild({
      provider: webpackProvider,
      rsbuildConfig: {
        tools: {
          tsLoader: {},
        },
      },
    });
    rsbuild.addPlugins([pluginReact()]);
    const config = await rsbuild.unwrapConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not apply react refresh when dev.hmr is false', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginReact()],
      provider: webpackProvider,
      rsbuildConfig: {
        dev: {
          hmr: false,
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginReact()],
      provider: webpackProvider,
      target: 'node',
      rsbuildConfig: {},
    });

    expect(await rsbuild.matchBundlerPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginReact()],
      provider: webpackProvider,
      target: 'web-worker',
      rsbuildConfig: {},
    });

    expect(await rsbuild.matchBundlerPlugin('ReactRefreshPlugin')).toBeFalsy();
  });
});
