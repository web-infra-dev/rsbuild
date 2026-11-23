import { createRsbuild, type RsbuildPluginAPI } from '@rsbuild/core';
import { matchRules } from '@scripts/test-helper';
import { modifyBabelLoaders, pluginBabel } from '../src';

describe('plugins/babel', () => {
  it('babel-loader should works with builtin:swc-loader', async () => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      config: {
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
      config: {
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

    const rspackConfigs = await rsbuild.initConfigs();
    for (const rspackConfig of rspackConfigs) {
      expect(matchRules(rspackConfig, 'a.tsx')[0]).toMatchSnapshot();
    }
  });

  it('should apply decorators version 2023-11 correctly', async () => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      config: {
        plugins: [pluginBabel()],
        source: {
          decorators: {
            version: '2023-11',
          },
        },
        performance: {
          buildCache: false,
        },
      },
    });

    const configs = await rsbuild.initConfigs();
    expect(matchRules(configs[0], 'a.tsx')[0]).toMatchSnapshot();
  });

  it('should set babel-loader', async () => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      config: {
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
      config: {
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

  it('should allow to add multiple babel rules', async () => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      config: {
        plugins: [
          pluginBabel({
            include: /a\.js$/,
            babelLoaderOptions: {
              plugins: ['babel-plugin-a'],
            },
          }),
          pluginBabel({
            include: /b\.js$/,
            babelLoaderOptions: {
              plugins: ['babel-plugin-b'],
            },
          }),
        ],
        performance: {
          buildCache: false,
        },
      },
    });

    const configs = await rsbuild.initConfigs();
    expect(matchRules(configs[0], 'a.js')).toMatchSnapshot();
  });

  it('should modify Babel loaders in known rules', async () => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      config: {
        plugins: [
          pluginBabel(),
          pluginBabel({ include: /standalone/ }),
          {
            name: 'test:modify-babel-loaders',
            setup(api: RsbuildPluginAPI) {
              api.modifyBundlerChain((chain, { CHAIN_ID }) => {
                chain.module.rules
                  .get(CHAIN_ID.RULE.JS_DATA_URI)
                  .use(CHAIN_ID.USE.BABEL)
                  .loader('babel-loader')
                  .options({ comments: true });

                chain.module
                  .rule('nested-rules')
                  .rule('babel')
                  .use(CHAIN_ID.USE.BABEL)
                  .loader('babel-loader')
                  .options({ comments: true });

                modifyBabelLoaders({
                  chain,
                  CHAIN_ID,
                  modifyOptions(options) {
                    return {
                      ...options,
                      comments: false,
                    };
                  },
                  modifyRule(rule, { babelUseId }) {
                    rule
                      .use('test-loader')
                      .after(babelUseId)
                      .loader('test-loader');
                  },
                });
              });
            },
          },
        ],
        performance: {
          buildCache: false,
        },
      },
    });

    const configs = await rsbuild.initConfigs();
    const rules = JSON.stringify(configs[0].module?.rules);

    expect(rules.match(/test-loader/g)).toHaveLength(3);
    expect(rules.match(/"comments":false/g)).toHaveLength(3);
    expect(rules.match(/"comments":true/g)).toHaveLength(1);
  });

  it('should configure Rspack loader cache when `cache` is true', async () => {
    const rsbuild = await createRsbuild({
      cwd: import.meta.dirname,
      config: {
        plugins: [
          pluginBabel({
            cache: true,
            babelLoaderOptions: {
              cacheDirectory: '/custom-cache',
            },
          }),
          pluginBabel({
            include: /foo\.js$/,
            cache: true,
          }),
        ],
      },
    });

    const configs = await rsbuild.initConfigs();
    const jsRules = matchRules(configs[0], 'foo.js');

    const defaultRule = jsRules.find(
      (rule) => rule && typeof rule === 'object' && 'oneOf' in rule,
    ) as {
      oneOf: Array<{
        use?: Array<{
          loader?: string;
          options?: Record<string, unknown>;
          cache?: boolean;
        }>;
      }>;
    };
    const defaultBabelUse = defaultRule.oneOf
      .flatMap((item) => item.use ?? [])
      .find((use) => use.loader?.includes('babel-loader'));

    expect(defaultBabelUse?.cache).toBe(true);
    expect(defaultBabelUse?.options?.cacheDirectory).toBeUndefined();
    expect(defaultBabelUse?.options?.cacheCompression).toBeUndefined();
    expect(defaultBabelUse?.options?.cacheIdentifier).toBeUndefined();

    const standaloneRule = jsRules.find(
      (rule) => rule && typeof rule === 'object' && 'use' in rule,
    ) as {
      use?: Array<{
        loader?: string;
        options?: Record<string, unknown>;
        cache?: boolean;
      }>;
    };
    const standaloneBabelUse = standaloneRule.use?.find((use) =>
      use.loader?.includes('babel-loader'),
    );

    expect(standaloneBabelUse?.cache).toBe(true);
    expect(standaloneBabelUse?.options?.cacheDirectory).toBeUndefined();
    expect(standaloneBabelUse?.options?.cacheCompression).toBeUndefined();
    expect(standaloneBabelUse?.options?.cacheIdentifier).toBeUndefined();
  });
});
