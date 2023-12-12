import { expect, describe, it } from 'vitest';
import { pluginReact } from '../src/webpack/plugins/react';
import { webpackProvider } from '../../webpack/src';
import { pluginBabel } from '../src/webpack/plugins/babel';
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
      rsbuildConfig: {
        output: {
          targets: ['node'],
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginReact()],
      provider: webpackProvider,
      rsbuildConfig: {
        output: {
          targets: ['web-worker'],
        },
      },
    });

    expect(await rsbuild.matchBundlerPlugin('ReactRefreshPlugin')).toBeFalsy();
  });
});
