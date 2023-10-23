import { expect, describe, it } from 'vitest';
import { pluginReact } from '@/plugins/react';
import { pluginBabel } from '@/plugins/babel';
import { pluginTsLoader } from '@/plugins/tsLoader';
import { createStubRsbuild } from '../helper';

describe('plugins/react', () => {
  it('should work with babel-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel(), pluginReact()],
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should work with ts-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginTsLoader(), pluginReact()],
      rsbuildConfig: {
        tools: {
          tsLoader: {},
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not apply react refresh when dev.hmr is false', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginReact()],
      rsbuildConfig: {
        dev: {
          hmr: false,
        },
      },
    });

    expect(await rsbuild.matchWebpackPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is node', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginReact()],
      target: 'node',
    });

    expect(await rsbuild.matchWebpackPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is web-worker', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginReact()],
      target: 'web-worker',
    });

    expect(await rsbuild.matchWebpackPlugin('ReactRefreshPlugin')).toBeFalsy();
  });
});
