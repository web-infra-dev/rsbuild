import { SCRIPT_REGEX } from '@rsbuild/shared';
import { createStubRsbuild } from '@scripts/test-helper';
import { describe, expect, it } from 'vitest';
import { pluginBabel } from '../src';

describe('plugins/babel', () => {
  it('babel-loader should works with builtin:swc-loader', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        source: {
          include: [/[\\/]node_modules[\\/]query-string[\\/]/],
          exclude: ['src/example'],
        },
        performance: {
          buildCache: false,
        },
      },
    });

    rsbuild.addPlugins([pluginBabel()]);

    const config = await rsbuild.unwrapConfig();

    expect(
      config.module.rules.find(
        (r) => r.test.toString() === SCRIPT_REGEX.toString(),
      ),
    ).toMatchSnapshot();
  });

  it('should set babel-loader', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [pluginBabel()],
      rsbuildConfig: {
        performance: {
          buildCache: false,
        },
      },
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should set babel-loader when config is add', async () => {
    const rsbuild = await createStubRsbuild({
      plugins: [
        pluginBabel({
          babelLoaderOptions: (config) => {
            config.cacheIdentifier = 'test';
            config.plugins?.push([
              'babel-plugin-import',
              {
                libraryName: 'my-components',
                libraryDirectory: 'es',
                style: true,
              },
            ]);
          },
        }),
      ],
      rsbuildConfig: {},
    });

    const bundlerConfigs = await rsbuild.initConfigs();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });
});
