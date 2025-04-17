import { createRsbuild } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { describe, expect, it } from 'vitest';
import { pluginBabel } from '../src';

describe('plugins/babel', () => {
  it('babel-loader should works with builtin:swc-loader', async () => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      rsbuildConfig: {
        plugins: [pluginBabel()],
        source: {
          include: [/node_modules[\\/]query-string[\\/]/],
          exclude: ['src/example'],
        },
        performance: {
          buildCache: false,
        },
      },
    });

    const config = await rsbuild.initConfigs();
    expect(matchRules(config[0], 'a.tsx')[0]).toMatchSnapshot();
  });

  it('should apply environment config correctly', async () => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      rsbuildConfig: {
        plugins: [pluginBabel()],
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

    const bundlerConfigs = await rsbuild.initConfigs();
    for (const bundlerConfig of bundlerConfigs) {
      expect(matchRules(bundlerConfig, 'a.tsx')[0]).toMatchSnapshot();
    }
  });

  it('should set babel-loader', async () => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      rsbuildConfig: {
        plugins: [pluginBabel()],
        performance: {
          buildCache: false,
        },
      },
    });

    const configs = await rsbuild.initConfigs();
    expect(matchRules(configs[0], 'a.tsx')[0]).toMatchSnapshot();
  });

  it('should set babel-loader when config is add', async () => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      rsbuildConfig: {
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
      },
    });

    const configs = await rsbuild.initConfigs();
    expect(matchRules(configs[0], 'a.tsx')[0]).toMatchSnapshot();
  });
});
