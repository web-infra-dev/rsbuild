import { createStubRsbuild, matchRules } from '@scripts/test-helper';
import { describe, expect, it } from 'vitest';
import { pluginBabel } from '../src';

describe('plugins/babel', () => {
  it('babel-loader should works with builtin:swc-loader', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        source: {
          include: [/node_modules[\\/]query-string[\\/]/],
          exclude: ['src/example'],
        },
        performance: {
          buildCache: false,
        },
      },
    });

    rsbuild.addPlugins([pluginBabel()]);

    const config = await rsbuild.unwrapConfig();
    expect(matchRules(config, 'a.tsx')[0]).toMatchSnapshot();
  });

  it('should apply environment config correctly', async () => {
    const rsbuild = await createStubRsbuild({
      rsbuildConfig: {
        environments: {
          web: {
            source: {
              exclude: ['src/example'],
              decorators: {
                version: '2022-03',
              },
            },
            performance: {
              buildCache: false,
            },
          },
          ssr: {
            source: {
              exclude: ['src/example1'],
              decorators: {
                version: 'legacy',
              },
            },
            performance: {
              buildCache: false,
            },
            output: {
              target: 'node',
            },
          },
        },
      },
    });

    rsbuild.addPlugins([pluginBabel()]);

    const bundlerConfigs = await rsbuild.initConfigs();

    for (const bundlerConfig of bundlerConfigs) {
      expect(matchRules(bundlerConfig, 'a.tsx')[0]).toMatchSnapshot();
    }
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
