import { matchPlugin, matchRules } from '@scripts/test-helper';
import { createRsbuild } from '../src';
import { isCSSModules } from '../src/helpers/css';
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
      namedExports: false,
      exportsConvention: 'camel-case',
      exportsOnly: false,
      esModule: true,
      modules: {
        localIdentHashDigest: 'base64url',
        localIdentHashDigestLength: 6,
        localIdentHashFunction: 'xxhash64',
        localIdentName: '[local]-[hash]',
        animation: true,
        dashedIdents: false,
        customIdents: false,
        container: false,
        grid: false,
        function: false,
        pure: false,
      },
    });

    expect(rspackConfig.experiments).not.toHaveProperty('css');
    expect(rspackConfig.module?.parser).toMatchObject({
      css: { namedExports: false },
      'css/auto': {
        namedExports: false,
        animation: true,
        dashedIdents: false,
        customIdents: false,
        container: false,
        grid: false,
        function: false,
        pure: false,
      },
      'css/global': {
        namedExports: false,
        animation: true,
        dashedIdents: false,
        customIdents: false,
        container: false,
        grid: false,
        function: false,
      },
      'css/module': {
        namedExports: false,
        animation: true,
        dashedIdents: false,
        customIdents: false,
        container: false,
        grid: false,
        function: false,
        pure: false,
      },
    });
    expect(rspackConfig.module?.parser?.['css/global']).not.toHaveProperty(
      'pure',
    );
    expect(rspackConfig.module?.parser?.css).not.toHaveProperty('exportType');
    expect(rspackConfig.module?.parser?.['css/auto']).not.toHaveProperty(
      'exportType',
    );
    expect(rspackConfig.module?.parser?.['css/global']).not.toHaveProperty(
      'exportType',
    );
    expect(rspackConfig.module?.parser?.['css/module']).not.toHaveProperty(
      'exportType',
    );
    expect(rspackConfig.module?.generator).toMatchObject({
      css: {
        exportsOnly: false,
        esModule: true,
      },
      'css/auto': {
        exportsConvention: 'camel-case',
        exportsOnly: false,
        esModule: true,
        localIdentHashDigest: 'base64url',
        localIdentHashDigestLength: 6,
        localIdentHashFunction: 'xxhash64',
        localIdentName: '[local]-[hash]',
      },
      'css/global': {
        exportsConvention: 'camel-case',
        exportsOnly: false,
        esModule: true,
        localIdentHashDigest: 'base64url',
        localIdentHashDigestLength: 6,
        localIdentHashFunction: 'xxhash64',
        localIdentName: '[local]-[hash]',
      },
      'css/module': {
        exportsConvention: 'camel-case',
        exportsOnly: false,
        esModule: true,
        localIdentHashDigest: 'base64url',
        localIdentHashDigestLength: 6,
        localIdentHashFunction: 'xxhash64',
        localIdentName: '[local]-[hash]',
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
        esModule: true,
      },
    });
  });

  it('should merge partial css options and modules options', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createRsbuild({
      config: {
        css: {
          exportType: 'style',
          namedExports: true,
          exportsConvention: 'as-is',
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
      namedExports: true,
      exportsConvention: 'as-is',
      exportsOnly: false,
      esModule: false,
      modules: {
        localIdentHashDigest: 'base64url',
        localIdentHashDigestLength: 6,
        localIdentHashFunction: 'xxhash64',
        localIdentHashSalt: 'my-salt',
        localIdentName: '[local]-[hash]',
        animation: true,
        dashedIdents: true,
        customIdents: false,
        container: false,
        grid: false,
        function: false,
        pure: false,
      },
    });
    expect(rspackConfig.output).not.toHaveProperty('cssFilename');
    expect(rspackConfig.output).not.toHaveProperty('cssChunkFilename');
    expect(rspackConfig.module?.parser).toMatchObject({
      css: {
        exportType: 'style',
        namedExports: true,
      },
      'css/auto': {
        exportType: 'style',
        namedExports: true,
      },
    });
    expect(rspackConfig.module?.generator?.['css/auto']).toMatchObject({
      exportsConvention: 'as-is',
      esModule: false,
      localIdentHashSalt: 'my-salt',
    });

    const cssRules = matchRules(
      rspackConfig,
      'a.css',
    ) as MatchedRuleWithOneOf[];
    const inlineRule = cssRules[0]?.oneOf?.find(
      (rule) => String(rule.resourceQuery) === String(/[?&]inline(?:&|=|$)/),
    );
    expect(inlineRule).toMatchObject({
      generator: {
        exportsOnly: false,
        esModule: true,
      },
    });
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

  it('should derive css.namedExports from css.exportType unless explicitly set', async () => {
    for (const exportType of ['text', 'css-style-sheet'] as const) {
      const rsbuild = await createRsbuild({
        config: {
          css: { exportType },
        },
      });
      const [rspackConfig] = await rsbuild.initConfigs();
      expect(rsbuild.getNormalizedConfig().css).toMatchObject({
        exportType,
        namedExports: true,
      });
      expect(rspackConfig.module?.parser).toMatchObject({
        css: { exportType, namedExports: true },
        'css/auto': { exportType, namedExports: true },
      });
    }

    const rsbuildOverride = await createRsbuild({
      config: {
        css: {
          exportType: 'text',
          namedExports: false,
        },
      },
    });
    const [overrideConfig] = await rsbuildOverride.initConfigs();
    expect(rsbuildOverride.getNormalizedConfig().css).toMatchObject({
      exportType: 'text',
      namedExports: false,
    });
    expect(overrideConfig.module?.parser).toMatchObject({
      css: { exportType: 'text', namedExports: false },
      'css/auto': { exportType: 'text', namedExports: false },
    });

    const rsbuildMultiEnv = await createRsbuild({
      config: {
        css: true,
        environments: {
          web: {},
          textEnv: {
            css: {
              exportType: 'text',
            },
          },
        },
      },
    });
    const [webConfig, textConfig] = await rsbuildMultiEnv.initConfigs();
    const { environments } = rsbuildMultiEnv.getNormalizedConfig();
    expect(environments.web.css).toMatchObject({
      exportType: 'link',
      namedExports: false,
    });
    expect(environments.textEnv.css).toMatchObject({
      exportType: 'text',
      namedExports: true,
    });
    expect(webConfig.module?.parser?.['css/auto']).toMatchObject({
      namedExports: false,
    });
    expect(textConfig.module?.parser?.['css/auto']).toMatchObject({
      namedExports: true,
    });
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
    expect(mainRule).toMatchObject({
      parser: { url: false },
    });
    expect(mainRule?.use).toEqual([
      expect.objectContaining({
        loader: expect.stringContaining('ignoreCssLoader'),
        options: {
          modules: { auto: true },
        },
      }),
    ]);

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

  it('should auto-convert output.injectStyles and output.emitCss and let css fields win without warnings', async () => {
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

    expect(warn).not.toHaveBeenCalled();
    expect(rsbuild.getNormalizedConfig().css).toMatchObject({
      exportType: 'style',
      exportsOnly: true,
    });
    expect(rspackConfig.module?.parser?.['css/auto']).toMatchObject({
      exportType: 'style',
    });
    expect(rspackConfig.module?.generator?.['css/auto']).toMatchObject({
      exportsOnly: true,
    });

    const rsbuildNode = await createRsbuild({
      config: {
        css: true,
        output: {
          target: 'node',
          emitCss: true,
        },
      },
    });
    const [nodeConfig] = await rsbuildNode.initConfigs();
    expect(rsbuildNode.getNormalizedConfig().css).toMatchObject({
      exportType: 'link',
      exportsOnly: false,
    });
    expect(nodeConfig.output).toMatchObject({
      cssFilename: 'static/css/[name].css',
    });

    const rsbuildOverride = await createRsbuild({
      config: {
        css: {
          exportType: 'link',
          exportsOnly: false,
        },
        output: {
          injectStyles: true,
          emitCss: false,
        },
      },
    });
    const warnOverride = rstest
      .spyOn(rsbuildOverride.logger, 'warn')
      .mockImplementation(() => {});

    const [overrideConfig] = await rsbuildOverride.initConfigs();
    expect(warnOverride).not.toHaveBeenCalled();
    expect(rsbuildOverride.getNormalizedConfig().css).toMatchObject({
      exportType: 'link',
      exportsOnly: false,
    });
    expect(overrideConfig.module?.parser?.['css/auto']).not.toHaveProperty(
      'exportType',
    );
    expect(overrideConfig.output).toMatchObject({
      cssFilename: 'static/css/[name].css',
      cssChunkFilename: 'static/css/async/[name].css',
    });
  });

  it('should auto-convert output.cssModules options and prefer explicit config.css fields', async () => {
    const conventions = [
      ['asIs', 'as-is'],
      ['camelCase', 'camel-case'],
      ['camelCaseOnly', 'camel-case-only'],
      ['dashes', 'dashes'],
      ['dashesOnly', 'dashes-only'],
    ] as const;

    for (const [legacyConvention, builtinConvention] of conventions) {
      const rsbuild = await createRsbuild({
        config: {
          css: true,
          output: {
            cssModules: {
              exportLocalsConvention: legacyConvention,
            },
          },
        },
      });
      const [rspackConfig] = await rsbuild.initConfigs();
      expect(rsbuild.getNormalizedConfig().css).toMatchObject({
        exportsConvention: builtinConvention,
      });
      expect(rspackConfig.module?.generator?.['css/auto']).toMatchObject({
        exportsConvention: builtinConvention,
      });
    }

    const localIdentCases = [
      {
        input: '[hash:base64:8]',
        expected: {
          localIdentName: '[hash]',
          localIdentHashDigest: 'base64url',
          localIdentHashDigestLength: 8,
        },
      },
      {
        input: '[hash:hex:4]',
        expected: {
          localIdentName: '[hash]',
          localIdentHashDigest: 'hex',
          localIdentHashDigestLength: 4,
        },
      },
      {
        input: '[local]_[hash:8]',
        expected: {
          localIdentName: '[local]_[hash]',
          localIdentHashDigest: 'base64url',
          localIdentHashDigestLength: 8,
        },
      },
      {
        input: '[sha256:hash:hex:10]',
        expected: {
          localIdentName: '[hash]',
          localIdentHashFunction: 'sha256',
          localIdentHashDigest: 'hex',
          localIdentHashDigestLength: 10,
        },
      },
    ] as const;

    for (const { input, expected } of localIdentCases) {
      const rsbuild = await createRsbuild({
        config: {
          css: true,
          output: {
            cssModules: {
              localIdentName: input,
            },
          },
        },
      });
      await rsbuild.initConfigs();
      expect(rsbuild.getNormalizedConfig().css).toMatchObject({
        modules: expected,
      });
    }

    const rsbuildPure = await createRsbuild({
      config: {
        css: true,
        output: {
          cssModules: {
            namedExport: true,
            mode: 'pure',
          },
        },
      },
    });
    const [pureConfig] = await rsbuildPure.initConfigs();
    expect(rsbuildPure.getNormalizedConfig().css).toMatchObject({
      namedExports: true,
      modules: {
        pure: true,
      },
    });
    expect(pureConfig.module?.parser?.['css/auto']).toMatchObject({
      namedExports: true,
      pure: true,
    });
    expect(pureConfig.module?.parser?.['css/module']).toMatchObject({
      namedExports: true,
      pure: true,
    });

    const rsbuildOverride = await createRsbuild({
      config: {
        css: {
          namedExports: false,
          exportsConvention: 'as-is',
          modules: {
            pure: false,
            localIdentName: '[local]__[hash]',
            localIdentHashDigest: 'base32',
            localIdentHashDigestLength: 5,
            localIdentHashFunction: 'md4',
          },
        },
        output: {
          cssModules: {
            namedExport: true,
            exportLocalsConvention: 'dashesOnly',
            mode: 'pure',
            localIdentName: '[sha256:hash:hex:10]',
          },
        },
      },
    });
    const [overrideConfig] = await rsbuildOverride.initConfigs();
    expect(rsbuildOverride.getNormalizedConfig().css).toMatchObject({
      namedExports: false,
      exportsConvention: 'as-is',
      modules: {
        pure: false,
        localIdentName: '[local]__[hash]',
        localIdentHashDigest: 'base32',
        localIdentHashDigestLength: 5,
        localIdentHashFunction: 'md4',
      },
    });
    expect(overrideConfig.module?.generator?.['css/auto']).toMatchObject({
      exportsConvention: 'as-is',
      localIdentName: '[local]__[hash]',
      localIdentHashDigest: 'base32',
      localIdentHashDigestLength: 5,
      localIdentHashFunction: 'md4',
    });
  });

  it('should map output.cssModules.auto and mode to built-in CSS rule types and sub-rules', async () => {
    const getMainAndUrl = async (
      rsbuild: Awaited<ReturnType<typeof createRsbuild>>,
    ) => {
      const [rspackConfig] = await rsbuild.initConfigs();
      const cssRules = matchRules(
        rspackConfig,
        'a.css',
      ) as MatchedRuleWithOneOf[];
      const oneOf = cssRules[0]?.oneOf;
      const mainRule = oneOf?.find(
        (rule) => !rule.resourceQuery && !rule.with,
      ) as
        | {
            type?: string;
            rules?: {
              type?: string;
              resource?: RegExp | ((path: string) => boolean);
              parser?: Record<string, unknown>;
            }[];
            use?: { loader?: string; options?: Record<string, unknown> }[];
          }
        | undefined;
      const urlRule = oneOf?.find(
        (rule) => String(rule.resourceQuery) === String(/[?&]url(?:&|=|$)/),
      ) as
        | {
            use?: { loader?: string; options?: Record<string, unknown> }[];
          }
        | undefined;
      return { mainRule, urlRule };
    };

    const rsbuildFalse = await createRsbuild({
      config: {
        css: { exportsOnly: true },
        output: { cssModules: { auto: false } },
      },
    });
    const falseRules = await getMainAndUrl(rsbuildFalse);
    expect(falseRules.mainRule?.type).toBe('css');
    expect(falseRules.mainRule?.rules).toBeUndefined();
    expect(falseRules.mainRule?.use?.[0]?.options).toEqual({
      modules: { auto: false },
    });
    expect(falseRules.urlRule?.use?.[0]?.options).toMatchObject({
      modules: { auto: false },
    });

    const autoFn = (resourcePath: string) => resourcePath.includes('.scoped.');
    const rsbuildAutoFn = await createRsbuild({
      config: {
        css: true,
        output: { cssModules: { auto: autoFn } },
      },
    });
    const fnRules = await getMainAndUrl(rsbuildAutoFn);
    expect(fnRules.mainRule?.type).toBe('css');
    expect(fnRules.mainRule?.rules).toHaveLength(1);
    expect(fnRules.mainRule?.rules?.[0]).toMatchObject({
      type: 'css/module',
      resource: expect.any(Function),
    });
    expect(
      (fnRules.mainRule?.rules?.[0]?.resource as (path: string) => boolean)(
        '/src/a.scoped.css',
      ),
    ).toBe(true);
    expect(
      (fnRules.mainRule?.rules?.[0]?.resource as (path: string) => boolean)(
        '/src/a.css',
      ),
    ).toBe(false);

    const rsbuildGlobal = await createRsbuild({
      config: {
        css: true,
        output: { cssModules: { mode: 'global' } },
      },
    });
    const globalRules = await getMainAndUrl(rsbuildGlobal);
    expect(globalRules.mainRule?.type).toBe('css');
    expect(globalRules.mainRule?.rules).toHaveLength(1);
    expect(globalRules.mainRule?.rules?.[0]).toMatchObject({
      type: 'css/global',
      resource: expect.any(RegExp),
    });
  });

  it('should warn once and fall back to local behavior for function mode when built-in CSS is enabled', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: true,
        output: {
          cssModules: {
            mode: () => 'global',
          },
        },
        environments: {
          web: {},
          node: { output: { target: 'node' } },
        },
      },
    });
    const warn = rstest
      .spyOn(rsbuild.logger, 'warn')
      .mockImplementation(() => {});

    const [webConfig, nodeConfig] = await rsbuild.initConfigs();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Function type `output.cssModules.mode` is not supported',
      ),
    );
    for (const rspackConfig of [webConfig, nodeConfig]) {
      const cssRules = matchRules(
        rspackConfig,
        'a.css',
      ) as MatchedRuleWithOneOf[];
      const mainRule = cssRules[0]?.oneOf?.find(
        (rule) => !rule.resourceQuery && !rule.with,
      );
      expect(mainRule?.type).toBe('css/auto');
      expect(mainRule?.rules).toBeUndefined();
    }
  });

  it('should warn once for unsupported mode: icss and exportGlobals when built-in CSS is enabled', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: true,
        output: {
          cssModules: {
            mode: 'icss',
            exportGlobals: true,
          },
        },
        environments: {
          web: {},
          node: { output: { target: 'node' } },
        },
      },
    });
    const warn = rstest
      .spyOn(rsbuild.logger, 'warn')
      .mockImplementation(() => {});

    await rsbuild.initConfigs();

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "`output.cssModules.mode: 'icss'` is not supported",
      ),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        '`output.cssModules.exportGlobals` is not supported',
      ),
    );
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

    expect(webConfig.module?.parser?.['css/auto']).not.toHaveProperty(
      'exportType',
    );
    expect(matchPlugin(legacyConfig, 'CssExtractRspackPlugin')).toBeDefined();
    expect(legacyConfig.module?.parser?.['css/auto']).toBeUndefined();
    expect(customConfig.module?.parser?.['css/auto']).toMatchObject({
      exportType: 'style',
    });
  });

  it.for(['node', 'web-worker'] as const)(
    'should default css.exportsOnly to true for %s target',
    async (target) => {
      const rsbuild = await createRsbuild({
        config: {
          css: true,
          output: { target },
        },
      });

      const [rspackConfig] = await rsbuild.initConfigs();
      const envConfig = Object.values(
        rsbuild.getNormalizedConfig().environments,
      )[0];

      expect(envConfig.css).toMatchObject({
        exportsOnly: true,
        exportType: 'link',
      });
      expect(rspackConfig.output).not.toHaveProperty('cssFilename');
      expect(rspackConfig.output).not.toHaveProperty('cssChunkFilename');
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
      expect(mainRule).toMatchObject({
        parser: { url: false },
      });
      expect(mainRule?.use).toEqual([
        expect.objectContaining({
          loader: expect.stringContaining('ignoreCssLoader'),
          options: {
            modules: { auto: true },
          },
        }),
      ]);
    },
  );

  it('should respect explicit css.exportsOnly: false on node target', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: {
          exportsOnly: false,
        },
        output: {
          target: 'node',
        },
      },
    });

    const [rspackConfig] = await rsbuild.initConfigs();
    const envConfig = rsbuild.getNormalizedConfig().environments.node;

    expect(envConfig.css).toMatchObject({
      exportsOnly: false,
    });
    expect(rspackConfig.output).toMatchObject({
      cssFilename: 'static/css/[name].css',
      cssChunkFilename: 'static/css/async/[name].css',
    });

    const cssRules = matchRules(
      rspackConfig,
      'a.css',
    ) as MatchedRuleWithOneOf[];
    const mainRule = cssRules[0]?.oneOf?.find(
      (rule) => rule.type === 'css/auto',
    );
    expect(mainRule?.parser).toBeUndefined();
    expect(JSON.stringify(mainRule?.use)).not.toContain('ignoreCssLoader');
  });

  it('should derive css.exportsOnly per environment target for top-level css', async () => {
    const rsbuild = await createRsbuild({
      config: {
        css: {
          exportType: 'style',
        },
        environments: {
          web: {},
          node: {
            output: { target: 'node' },
          },
          nodeEmit: {
            css: {
              exportsOnly: false,
            },
            output: { target: 'node' },
          },
        },
      },
    });

    const [webConfig, nodeConfig, nodeEmitConfig] = await rsbuild.initConfigs();
    const { environments } = rsbuild.getNormalizedConfig();

    expect(environments.web.css).toMatchObject({
      exportType: 'style',
      exportsOnly: false,
    });
    expect(environments.node.css).toMatchObject({
      exportType: 'style',
      exportsOnly: true,
    });
    expect(environments.nodeEmit.css).toMatchObject({
      exportType: 'style',
      exportsOnly: false,
    });

    expect(webConfig.module?.generator?.['css/auto']).toMatchObject({
      exportsOnly: false,
    });
    expect(nodeConfig.module?.generator?.['css/auto']).toMatchObject({
      exportsOnly: true,
    });
    expect(nodeEmitConfig.module?.generator?.['css/auto']).toMatchObject({
      exportsOnly: false,
    });
  });
});

describe('isCSSModules', () => {
  const createLoaderContext = ({
    resourcePath,
    resourceQuery = '',
    resourceFragment = '',
    matchResource,
  }: {
    resourcePath: string;
    resourceQuery?: string;
    resourceFragment?: string;
    matchResource?: string;
  }) =>
    ({
      resourcePath,
      resourceQuery,
      resourceFragment,
      _module: matchResource !== undefined ? { matchResource } : undefined,
    }) as unknown as Parameters<typeof isCSSModules>[1];

  it('should strip query and fragment from matchResource when detecting CSS Modules', () => {
    expect(
      isCSSModules(
        { auto: true },
        createLoaderContext({
          resourcePath: '/src/App.vue',
          resourceQuery: '?vue&type=style&index=0&module=true&lang=css',
          matchResource:
            '/src/App.vue.module.css?vue&type=style&index=0&module=true&lang=css',
        }),
      ),
    ).toBe(true);

    expect(
      isCSSModules(
        { auto: true },
        createLoaderContext({
          resourcePath: '/src/App.vue',
          resourceQuery: '?vue&type=style&index=0&module=true&lang=less',
          matchResource:
            '/src/App.vue.module.less?vue&type=style&index=0&module=true&lang=less',
        }),
      ),
    ).toBe(true);

    expect(
      isCSSModules(
        { auto: true },
        createLoaderContext({
          resourcePath: '/src/App.vue',
          resourceQuery: '?vue&type=style&index=0&lang=css',
          matchResource: '/src/App.vue.css?vue&type=style&index=0&lang=css',
        }),
      ),
    ).toBe(false);
  });

  it('should fall back to resourcePath when matchResource is absent', () => {
    expect(
      isCSSModules(
        { auto: true },
        createLoaderContext({
          resourcePath: '/src/a.module.css',
        }),
      ),
    ).toBe(true);

    expect(
      isCSSModules(
        { auto: true },
        createLoaderContext({
          resourcePath: '/src/a.css',
        }),
      ),
    ).toBe(false);
  });
});
