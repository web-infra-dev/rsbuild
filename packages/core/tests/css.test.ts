import { matchPlugin, matchRules } from '@scripts/test-helper';
import { createRsbuild, pluginRspackBuiltinCss, type Rspack } from '../src';
import { normalizeCssLoaderOptions } from '../src/plugins/css';

describe('normalizeCssLoaderOptions', () => {
  it('should enable exportOnlyLocals correctly', () => {
    expect(normalizeCssLoaderOptions({ modules: false }, true)).toEqual({
      modules: false,
    });

    expect(normalizeCssLoaderOptions({ modules: true }, true)).toEqual({
      modules: {
        exportOnlyLocals: true,
      },
    });

    expect(normalizeCssLoaderOptions({ modules: true }, false)).toEqual({
      modules: true,
    });

    expect(normalizeCssLoaderOptions({ modules: 'local' }, true)).toEqual({
      modules: {
        mode: 'local',
        exportOnlyLocals: true,
      },
    });

    expect(normalizeCssLoaderOptions({ modules: { auto: true } }, true)).toEqual({
      modules: {
        auto: true,
        exportOnlyLocals: true,
      },
    });
  });
});

describe('plugin-css', () => {
  it('should enable source map when output.sourceMap.css is true', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          sourceMap: {
            css: true,
          },
        },
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();

    expect(JSON.stringify(rspackConfigs[0])).toContain('"sourceMap":true');
  });

  it('should disable source map when output.sourceMap.css is false', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          sourceMap: {
            css: false,
          },
        },
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();

    expect(JSON.stringify(rspackConfigs[0])).toContain('"sourceMap":false');
  });

  it('should disable source map in production by default', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createRsbuild();

    const rspackConfigs = await rsbuild.initConfigs();

    expect(JSON.stringify(rspackConfigs[0])).toContain('"sourceMap":false');
  });

  it('should allow customizing cssModules.localIdentName', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          cssModules: {
            localIdentName: '[hash]',
          },
        },
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();

    expect(JSON.stringify(rspackConfigs[0])).toContain('"localIdentName":"[hash]"');
  });

  it('should use custom cssModules rule when using output.cssModules config', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          cssModules: {
            auto: (resourcePath) => resourcePath.includes('.module.'),
          },
        },
      },
    });
    const rspackConfigs = await rsbuild.initConfigs();
    expect(matchRules(rspackConfigs[0], 'a.module.css')).toMatchSnapshot();
  });
});

describe('plugin-rspack-builtin-css', () => {
  it('should replace the default CSS pipeline and translate CSS Modules options', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          cssModules: {
            exportLocalsConvention: 'dashesOnly',
            localIdentName: 'custom__[local]',
            mode: 'global',
            namedExport: true,
          },
        },
        plugins: [pluginRspackBuiltinCss()],
      },
    });
    const warn = rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});

    const [rspackConfig] = await rsbuild.initConfigs();

    expect(matchRules(rspackConfig, 'a.module.css')).toMatchSnapshot();
    expect(matchPlugin(rspackConfig, 'CssExtractRspackPlugin')).toBeFalsy();
    expect(rspackConfig.experiments?.css).toBe(true);
    expect(rspackConfig.module?.parser).toMatchObject({
      'css/auto': {
        namedExports: true,
      },
    });
    expect(rspackConfig.module?.generator).toMatchObject({
      'css/auto': {
        exportsConvention: 'dashes-only',
        exportsOnly: false,
        localIdentName: 'custom__[local]',
      },
    });
    expect(rspackConfig.output).toMatchObject({
      cssChunkFilename: 'static/css/async/[name].css',
      cssFilename: 'static/css/[name].css',
    });
    expect(warn).toHaveBeenCalledWith(
      'CSS `?url` imports are not supported by `pluginRspackBuiltinCss`. The `?url` query will be ignored.',
    );
  });

  it('should preserve Rspack defaults when optional CSS Modules settings are not configured', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [pluginRspackBuiltinCss()],
      },
    });
    rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});

    const [rspackConfig] = await rsbuild.initConfigs();

    expect(rspackConfig.module?.generator?.['css/auto']).not.toHaveProperty('localIdentName');
  });

  it('should translate pure CSS Modules mode', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          cssModules: {
            mode: 'pure',
          },
        },
        plugins: [pluginRspackBuiltinCss()],
      },
    });
    rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});

    const [rspackConfig] = await rsbuild.initConfigs();

    expect(rspackConfig.module?.parser?.['css/auto']).toMatchObject({ pure: true });
  });

  it('should disable CSS Modules when output.cssModules.auto is false', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          cssModules: {
            auto: false,
          },
        },
        plugins: [pluginRspackBuiltinCss()],
      },
    });
    rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});

    const [rspackConfig] = await rsbuild.initConfigs();
    const rules = matchRules(rspackConfig, 'a.module.css');
    const oneOf = (rules[0] as { oneOf?: Rspack.RuleSetRule[] }).oneOf;

    expect(oneOf?.some((rule) => rule.type === 'css')).toBe(true);
    expect(oneOf?.some((rule) => rule.type === 'css/module')).toBe(false);
  });

  it('should preserve loaders added to existing CSS rules', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          {
            name: 'test:extend-css-rule',
            setup(api) {
              api.modifyBundlerChain((chain, { CHAIN_ID }) => {
                chain.module
                  .rule(CHAIN_ID.RULE.CSS)
                  .oneOf(CHAIN_ID.ONE_OF.CSS_MAIN)
                  .use('custom-css-loader')
                  .loader('custom-css-loader');
              });
            },
          },
          pluginRspackBuiltinCss(),
        ],
      },
    });
    rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});

    const [rspackConfig] = await rsbuild.initConfigs();
    const rules = matchRules(rspackConfig, 'a.module.css');
    const oneOf = (rules[0] as { oneOf?: Rspack.RuleSetRule[] }).oneOf;
    const styleRules = oneOf?.filter(
      (rule) =>
        rule.type === 'css/module' ||
        (rule.type === 'css/auto' && rule.parser?.exportType !== 'text'),
    );

    expect(styleRules).toHaveLength(2);
    expect(
      styleRules?.every((rule) =>
        rule.use?.some((use) =>
          typeof use === 'object' ? use.loader === 'custom-css-loader' : false,
        ),
      ),
    ).toBe(true);
  });

  it('should warn about unsupported CSS Modules options', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          cssModules: {
            auto: /\.custom\.css$/,
            exportGlobals: true,
            mode: 'icss',
          },
        },
        plugins: [pluginRspackBuiltinCss()],
      },
    });
    const warn = rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});

    await rsbuild.initConfigs();

    expect(warn).toHaveBeenCalledWith(
      "RegExp and function values for `output.cssModules.auto` are not supported by `pluginRspackBuiltinCss`. Rspack's default CSS Modules matching will be used instead.",
    );
    expect(warn).toHaveBeenCalledWith(
      "The 'icss' and function values for `output.cssModules.mode` are not supported by `pluginRspackBuiltinCss`. The value will be ignored and local mode will be used instead.",
    );
    expect(warn).toHaveBeenCalledWith(
      '`output.cssModules.exportGlobals` is not supported by `pluginRspackBuiltinCss`. The value will be ignored.',
    );
  });

  it('should warn when used with the Vue plugin', async () => {
    const rsbuild = await createRsbuild({
      config: {
        plugins: [
          {
            name: 'rsbuild:vue',
            setup() {},
          },
          pluginRspackBuiltinCss(),
        ],
      },
    });
    const warn = rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});

    await rsbuild.initConfigs();

    expect(warn).toHaveBeenCalledWith(
      'Vue SFC CSS Modules (`<style module>`) are not supported by `pluginRspackBuiltinCss`.',
    );
  });
});

describe('plugin-css injectStyles', () => {
  it('should use css-loader + style-loader when injectStyles is true', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          injectStyles: true,
        },
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();

    expect(matchRules(rspackConfigs[0], 'a.css')).toMatchSnapshot();
  });

  it('should apply ignoreCssLoader when injectStyles is true and target is node', async () => {
    const rsbuild = await createRsbuild({
      config: {
        output: {
          target: 'node',
          injectStyles: true,
        },
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();

    expect(matchRules(rspackConfigs[0], 'a.css')).toMatchSnapshot();
  });
});

it('should ensure isolation of PostCSS config objects between different builds', async () => {
  const rsbuild = await createRsbuild({
    config: {
      environments: {
        web: {
          tools: {
            postcss(config) {
              config.postcssOptions ||= {};
              if (typeof config.postcssOptions === 'object') {
                config.postcssOptions.plugins = [{ postcssPlugin: 'foo' }];
              }
            },
          },
        },
        web2: {
          tools: {
            postcss(config) {
              config.postcssOptions ||= {};
              if (typeof config.postcssOptions === 'object') {
                config.postcssOptions.plugins = [{ postcssPlugin: 'bar' }];
              }
            },
          },
        },
      },
    },
  });

  const rspackConfigs = await rsbuild.initConfigs();
  expect(matchRules(rspackConfigs[0], 'a.css')).toMatchSnapshot();
  expect(matchRules(rspackConfigs[1], 'a.css')).toMatchSnapshot();
});
