import { expect, describe, it } from 'vitest';
import { pluginReact } from '@/plugins/react';
import { pluginBabel } from '@/plugins/babel';
import { pluginTsLoader } from '@/plugins/tsLoader';
import { createStubRsbuild } from '../helper';

describe('plugins/react', () => {
  it('should work with babel-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel(), pluginReact()],
      builderConfig: {
        output: {
          disableTsChecker: true,
        },
      },
    });
    const config = await rsbuild.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should work with ts-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginTsLoader(), pluginReact()],
      builderConfig: {
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
      builderConfig: {
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
