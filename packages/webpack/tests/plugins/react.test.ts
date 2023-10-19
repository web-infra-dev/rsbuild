import { expect, describe, it } from 'vitest';
import { pluginReact } from '@/plugins/react';
import { pluginBabel } from '@/plugins/babel';
import { pluginTsLoader } from '@/plugins/tsLoader';
import { createStubBuilder } from '../helper';

describe('plugins/react', () => {
  it('should work with babel-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginBabel(), pluginReact()],
      builderConfig: {
        output: {
          disableTsChecker: true,
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should work with ts-loader', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginTsLoader(), pluginReact()],
      builderConfig: {
        tools: {
          tsLoader: {},
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();

    expect(config).toMatchSnapshot();
  });

  it('should not apply react refresh when dev.hmr is false', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginReact()],
      builderConfig: {
        dev: {
          hmr: false,
        },
      },
    });

    expect(await builder.matchWebpackPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is node', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginReact()],
      target: 'node',
    });

    expect(await builder.matchWebpackPlugin('ReactRefreshPlugin')).toBeFalsy();
  });

  it('should not apply react refresh when target is web-worker', async () => {
    const builder = await createStubBuilder({
      plugins: [pluginReact()],
      target: 'web-worker',
    });

    expect(await builder.matchWebpackPlugin('ReactRefreshPlugin')).toBeFalsy();
  });
});
