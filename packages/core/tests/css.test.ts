import { matchPlugin, matchRules } from '@scripts/test-helper';
import { createRsbuild } from '../src';
import { normalizeCssLoaderOptions } from '../src/plugins/css';

type MatchedRule = Record<string, unknown>;
type MatchedRuleWithOneOf = { oneOf?: MatchedRule[] };

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

    expect(
      normalizeCssLoaderOptions({ modules: { auto: true } }, true),
    ).toEqual({
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

    expect(JSON.stringify(rspackConfigs[0])).toContain(
      '"localIdentName":"[hash]"',
    );
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

describe('plugin-css builtin css', () => {
  it('should configure Rspack built-in CSS defaults when css is true', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: true,
      },
    });

    const [rspackConfig] = await rsbuild.initConfigs();

    expect(rsbuild.getNormalizedConfig().css).toEqual({
      exportType: 'link',
      exportsConvention: 'as-is',
      exportsOnly: false,
      esModule: true,
      modules: {
        localIdentHashDigest: 'base64url',
        localIdentHashDigestLength: 6,
        localIdentHashFunction: 'xxhash64',
        localIdentName: '[uniqueName]-[id]-[local]',
        animation: true,
        dashedIdents: false,
        customIdents: false,
        container: false,
        grid: false,
        function: false,
      },
    });

    expect(rspackConfig.experiments).not.toHaveProperty('css');
    expect(rspackConfig.module?.parser).toMatchObject({
      css: { exportType: 'link' },
      'css/auto': {
        exportType: 'link',
        animation: true,
        dashedIdents: false,
        customIdents: false,
        container: false,
        grid: false,
        function: false,
      },
      'css/global': {
        exportType: 'link',
        animation: true,
        dashedIdents: false,
        customIdents: false,
        container: false,
        grid: false,
        function: false,
      },
      'css/module': {
        exportType: 'link',
        animation: true,
        dashedIdents: false,
        customIdents: false,
        container: false,
        grid: false,
        function: false,
      },
    });
    expect(rspackConfig.module?.generator).toMatchObject({
      css: {
        exportsOnly: false,
        esModule: true,
      },
      'css/auto': {
        exportsConvention: 'as-is',
        exportsOnly: false,
        esModule: true,
        localIdentHashDigest: 'base64url',
        localIdentHashDigestLength: 6,
        localIdentHashFunction: 'xxhash64',
        localIdentName: '[uniqueName]-[id]-[local]',
      },
      'css/global': {
        exportsConvention: 'as-is',
        exportsOnly: false,
        esModule: true,
        localIdentHashDigest: 'base64url',
        localIdentHashDigestLength: 6,
        localIdentHashFunction: 'xxhash64',
        localIdentName: '[uniqueName]-[id]-[local]',
      },
      'css/module': {
        exportsConvention: 'as-is',
        exportsOnly: false,
        esModule: true,
        localIdentHashDigest: 'base64url',
        localIdentHashDigestLength: 6,
        localIdentHashFunction: 'xxhash64',
        localIdentName: '[uniqueName]-[id]-[local]',
      },
    });
    expect(rspackConfig.module?.generator?.css).not.toHaveProperty(
      'localIdentName',
    );
    expect(rspackConfig.output).toMatchObject({
      cssFilename: 'static/css/[name].css',
      cssChunkFilename: 'static/css/async/[name].css',
    });
    expect(matchPlugin(rspackConfig, 'CssExtractRspackPlugin')).toBeNull();

    const cssRules = matchRules(
      rspackConfig,
      'a.css',
    ) as MatchedRuleWithOneOf[];
    const oneOf = cssRules[0]?.oneOf;
    expect(oneOf).toBeDefined();
    expect(JSON.stringify(oneOf)).not.toContain('compiled/css-loader');
    expect(JSON.stringify(oneOf)).not.toContain('style-loader');
    expect(JSON.stringify(oneOf)).not.toContain('cssExtractLoader');
    expect(JSON.stringify(oneOf)).not.toContain('ignoreCssLoader');

    const urlRule = oneOf?.find(
      (rule) => String(rule.resourceQuery) === String(/[?&]url(?:&|=|$)/),
    );
    expect(urlRule).toMatchObject({
      resolve: { preferRelative: true },
    });
    expect(urlRule?.use).toEqual([
      expect.objectContaining({
        loader: expect.stringContaining('cssUrlLoader'),
        options: expect.objectContaining({
          builtinCss: true,
          filename: 'static/css/[name].css',
          modules: { auto: true },
        }),
      }),
      expect.objectContaining({
        loader: 'builtin:lightningcss-loader',
      }),
    ]);

    expect(
      oneOf?.find(
        (rule) => rule.type === 'css/auto' && !rule.resourceQuery && !rule.with,
      ),
    ).toMatchObject({
      type: 'css/auto',
      sideEffects: true,
      resolve: { preferRelative: true },
    });
    expect(
      oneOf?.find(
        (rule) => String(rule.resourceQuery) === String(/[?&]inline(?:&|=|$)/),
      ),
    ).toMatchObject({
      type: 'css',
      parser: {
        exportType: 'text',
        namedExports: true,
      },
      generator: {
        exportsOnly: false,
      },
    });
  });

  it('should merge partial css options and modules options', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createRsbuild({
      config: {
        css: {
          exportType: 'style',
          exportsConvention: 'camel-case',
          esModule: false,
          modules: {
            dashedIdents: true,
            localIdentHashSalt: 'my-salt',
          },
        },
      },
    });

    const [rspackConfig] = await rsbuild.initConfigs();

    expect(rsbuild.getNormalizedConfig().css).toEqual({
      exportType: 'style',
      exportsConvention: 'camel-case',
      exportsOnly: false,
      esModule: false,
      modules: {
        localIdentHashDigest: 'base64url',
        localIdentHashDigestLength: 6,
        localIdentHashFunction: 'xxhash64',
        localIdentHashSalt: 'my-salt',
        localIdentName: '[uniqueName]-[id]-[local]',
        animation: true,
        dashedIdents: true,
        customIdents: false,
        container: false,
        grid: false,
        function: false,
      },
    });
    expect(rspackConfig.output).not.toHaveProperty('cssFilename');
    expect(rspackConfig.output).not.toHaveProperty('cssChunkFilename');
    expect(rspackConfig.module?.generator?.['css/auto']).toMatchObject({
      exportsConvention: 'camel-case',
      esModule: false,
      localIdentHashSalt: 'my-salt',
    });

    const cssRules = matchRules(
      rspackConfig,
      'a.css',
    ) as MatchedRuleWithOneOf[];
    const mainRule = cssRules[0]?.oneOf?.find(
      (rule) => rule.type === 'css/auto',
    );
    expect(mainRule?.use).toEqual([
      expect.objectContaining({
        loader: 'builtin:lightningcss-loader',
        options: expect.objectContaining({
          minify: true,
        }),
      }),
    ]);
  });

  it('should support css.exportsOnly without emitting CSS files or running main loaders', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: {
          exportsOnly: true,
        },
      },
    });

    const [rspackConfig] = await rsbuild.initConfigs();
    expect(rspackConfig.output).not.toHaveProperty('cssFilename');
    expect(rspackConfig.output).not.toHaveProperty('cssChunkFilename');
    expect(rspackConfig.module?.generator?.css).toMatchObject({
      exportsOnly: true,
    });
    expect(rspackConfig.module?.generator?.['css/auto']).toMatchObject({
      exportsOnly: true,
    });

    const cssRules = matchRules(
      rspackConfig,
      'a.css',
    ) as MatchedRuleWithOneOf[];
    const mainRule = cssRules[0]?.oneOf?.find(
      (rule) => rule.type === 'css/auto',
    );
    expect(mainRule?.use).toBeUndefined();

    const urlRule = cssRules[0]?.oneOf?.find(
      (rule) => String(rule.resourceQuery) === String(/[?&]url(?:&|=|$)/),
    );
    expect(urlRule?.use).toEqual([
      expect.objectContaining({
        loader: expect.stringContaining('cssUrlLoader'),
        options: expect.objectContaining({
          builtinCss: true,
        }),
      }),
      expect.objectContaining({
        loader: 'builtin:lightningcss-loader',
      }),
    ]);
  });

  it('should ignore output.injectStyles and output.emitCss and warn when css is enabled', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: true,
        output: {
          injectStyles: true,
          emitCss: false,
        },
      },
    });
    const warn = rstest
      .spyOn(rsbuild.logger, 'warn')
      .mockImplementation(() => {});

    const [rspackConfig] = await rsbuild.initConfigs();

    expect(warn).toHaveBeenCalledTimes(2);
    expect(rspackConfig.module?.parser?.['css/auto']).toMatchObject({
      exportType: 'link',
    });
    expect(rspackConfig.module?.generator?.['css/auto']).toMatchObject({
      exportsOnly: false,
    });
    expect(rspackConfig.output).toMatchObject({
      cssFilename: 'static/css/[name].css',
      cssChunkFilename: 'static/css/async/[name].css',
    });

    const rsbuildExportsOnly = await createRsbuild({
      config: {
        css: {
          exportsOnly: true,
        },
        output: {
          emitCss: true,
        },
      },
    });
    const warn2 = rstest
      .spyOn(rsbuildExportsOnly.logger, 'warn')
      .mockImplementation(() => {});

    const [rspackConfig2] = await rsbuildExportsOnly.initConfigs();
    expect(warn2).toHaveBeenCalledTimes(1);
    expect(rspackConfig2.module?.generator?.['css/auto']).toMatchObject({
      exportsOnly: true,
    });
  });

  it('should support multi-environment overrides for top-level css', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: true,
        environments: {
          web: {},
          legacy: {
            css: false,
          },
          custom: {
            css: {
              exportType: 'style',
            },
          },
        },
      },
    });

    const [webConfig, legacyConfig, customConfig] = await rsbuild.initConfigs();

    expect(webConfig.module?.parser?.['css/auto']).toMatchObject({
      exportType: 'link',
    });
    expect(matchPlugin(legacyConfig, 'CssExtractRspackPlugin')).toBeDefined();
    expect(legacyConfig.module?.parser?.['css/auto']).toBeUndefined();
    expect(customConfig.module?.parser?.['css/auto']).toMatchObject({
      exportType: 'style',
    });
  });
});
