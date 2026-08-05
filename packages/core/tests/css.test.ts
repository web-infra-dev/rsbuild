import { matchPlugin, matchRules } from '@scripts/test-helper';
import { createRsbuild } from '../src';
import { normalizeCssLoaderOptions } from '../src/plugins/css';

const getRuleLoaders = (rules: unknown): string[] => {
  const loaders: string[] = [];

  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === 'object') {
      if ('loader' in value && typeof value.loader === 'string') {
        loaders.push(value.loader.replaceAll('\\', '/'));
      }
      Object.values(value).forEach(visit);
    }
  };

  visit(rules);
  return loaders;
};

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

  it('should use Rspack built-in CSS when experiments.css is true', async () => {
    const rsbuild = await createRsbuild({
      config: {
        experiments: {
          css: true,
        },
        tools: {
          css: {
            parser: {
              import: false,
              namedExports: true,
            },
            generator: {
              exportsConvention: 'dashes-only',
              localIdentName: 'custom__[local]',
            },
          },
          cssLoader() {
            throw new Error('tools.cssLoader should not be called');
          },
        },
      },
    });

    const warn = rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});
    const rspackConfigs = await rsbuild.initConfigs();
    const rules = matchRules(rspackConfigs[0], 'a.css');
    const loaders = getRuleLoaders(rules);
    const oneOf = (rules[0] as { oneOf?: Record<string, any>[] }).oneOf;
    const mainRule = oneOf?.find(
      (rule) => rule.type === 'css/auto' && rule.parser?.exportType !== 'text',
    );
    const cssModulesRule = oneOf?.find(
      (rule) => rule.type === 'css/module' && String(rule.test).includes('module'),
    );
    const inlineRule = oneOf?.find((rule) => rule.parser?.exportType === 'text');
    const urlRule = oneOf?.find((rule) => String(rule.resourceQuery).includes('url'));

    expect(mainRule).toBeTruthy();
    expect(cssModulesRule).toBeTruthy();
    expect(urlRule).toBeUndefined();
    expect(inlineRule).toMatchObject({
      type: 'css/auto',
      parser: {
        exportType: 'text',
        namedExports: true,
      },
    });
    expect(inlineRule).not.toHaveProperty('generator');
    expect(loaders.some((loader) => loader.includes('css-loader/index'))).toBe(false);
    expect(loaders.some((loader) => loader.includes('style-loader/index'))).toBe(false);
    expect(loaders.some((loader) => loader.includes('cssExtractLoader'))).toBe(false);
    expect(loaders).toContain('builtin:lightningcss-loader');
    expect(matchPlugin(rspackConfigs[0], 'CssExtractRspackPlugin')).toBeFalsy();
    expect(rspackConfigs[0].experiments?.css).toBe(true);
    expect(rspackConfigs[0].module?.parser).toMatchObject({
      'css/auto': {
        import: false,
        namedExports: true,
      },
    });
    expect(rspackConfigs[0].module?.parser?.['css/auto']).not.toHaveProperty('url');
    expect(rspackConfigs[0].module?.generator).toMatchObject({
      'css/auto': {
        exportsConvention: 'dashes-only',
        exportsOnly: false,
        localIdentName: 'custom__[local]',
      },
    });
    expect(rspackConfigs[0].output).toMatchObject({
      cssFilename: 'static/css/[name].css',
      cssChunkFilename: 'static/css/async/[name].css',
    });
    expect(warn).toHaveBeenCalledWith(
      'CSS `?url` imports are not supported when `experiments.css` is enabled. The `?url` query will be ignored.',
    );
  });

  it('should use Rspack default localIdentName with built-in CSS', async () => {
    const rsbuild = await createRsbuild({
      config: {
        experiments: {
          css: true,
        },
      },
    });

    rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});
    const rspackConfigs = await rsbuild.initConfigs();

    expect(rspackConfigs[0].module?.generator?.['css/auto']).not.toHaveProperty('localIdentName');
  });

  it('should use global mode for CSS Modules with built-in CSS', async () => {
    const rsbuild = await createRsbuild({
      config: {
        experiments: {
          css: true,
        },
        output: {
          cssModules: {
            mode: 'global',
          },
        },
      },
    });

    rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});
    const rspackConfigs = await rsbuild.initConfigs();
    const rules = matchRules(rspackConfigs[0], 'a.module.css');
    const oneOf = (rules[0] as { oneOf?: Record<string, any>[] }).oneOf;
    const cssModulesRule = oneOf?.find((rule) => String(rule.test).includes('module'));
    const mainRule = oneOf?.find(
      (rule) => rule.type === 'css/auto' && rule.parser?.exportType !== 'text',
    );

    expect(cssModulesRule).toMatchObject({
      sideEffects: true,
      type: 'css/global',
    });
    expect(mainRule).toBeTruthy();
  });

  it('should ignore tools.css when experiments.css is disabled', async () => {
    const rsbuild = await createRsbuild({
      config: {
        tools: {
          css: {
            parser: {
              namedExports: true,
            },
            generator: {
              exportsOnly: true,
            },
          },
        },
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();

    expect(rspackConfigs[0].module?.parser?.['css/auto']).toBeUndefined();
    expect(rspackConfigs[0].module?.generator?.['css/auto']).toBeUndefined();
  });

  it.each([/\.custom\.css$/, (resourcePath: string) => resourcePath.endsWith('.custom.css')])(
    'should warn about custom cssModules.auto when experiments.css is enabled',
    async (auto) => {
      const rsbuild = await createRsbuild({
        config: {
          experiments: {
            css: true,
          },
          output: {
            cssModules: {
              auto,
            },
          },
        },
      });

      const warn = rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});
      const rspackConfigs = await rsbuild.initConfigs();
      const rules = matchRules(rspackConfigs[0], 'a.custom.css');
      const oneOf = (rules[0] as { oneOf?: Record<string, any>[] }).oneOf;

      expect(oneOf).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: 'css/auto' })]),
      );
      expect(warn).toHaveBeenCalledWith(
        "RegExp and function values for `output.cssModules.auto` are not supported when `experiments.css` is enabled. Rspack's default CSS Modules matching will be used instead.",
      );
    },
  );

  it.each(['icss' as const, () => 'global' as const])(
    'should warn about unsupported cssModules.mode when experiments.css is enabled',
    async (mode) => {
      const rsbuild = await createRsbuild({
        config: {
          experiments: {
            css: true,
          },
          output: {
            cssModules: {
              mode,
            },
          },
        },
      });

      const warn = rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});
      const rspackConfigs = await rsbuild.initConfigs();
      const rules = matchRules(rspackConfigs[0], 'a.module.css');
      const oneOf = (rules[0] as { oneOf?: Record<string, any>[] }).oneOf;
      const cssModulesRule = oneOf?.find((rule) => String(rule.test).includes('module'));

      expect(cssModulesRule).toMatchObject({ type: 'css/module' });
      expect(warn).toHaveBeenCalledWith(
        "The 'icss' and function values for `output.cssModules.mode` are not supported when `experiments.css` is enabled. The value will be ignored and local mode will be used instead.",
      );
    },
  );

  it('should warn about unsupported cssModules.exportGlobals when experiments.css is enabled', async () => {
    const rsbuild = await createRsbuild({
      config: {
        experiments: {
          css: true,
        },
        output: {
          cssModules: {
            exportGlobals: true,
          },
        },
      },
    });

    const warn = rstest.spyOn(rsbuild.logger, 'warn').mockImplementation(() => {});
    await rsbuild.initConfigs();

    expect(warn).toHaveBeenCalledWith(
      '`output.cssModules.exportGlobals` is not supported when `experiments.css` is enabled. The value will be ignored.',
    );
  });

  it('should use built-in style exports when injectStyles is true', async () => {
    const rsbuild = await createRsbuild({
      config: {
        experiments: {
          css: true,
        },
        output: {
          injectStyles: true,
        },
      },
    });

    const rspackConfigs = await rsbuild.initConfigs();
    const rules = matchRules(rspackConfigs[0], 'a.css');
    const loaders = getRuleLoaders(rules);

    expect(loaders.some((loader) => loader.includes('css-loader/index'))).toBe(false);
    expect(loaders.some((loader) => loader.includes('style-loader/index'))).toBe(false);
    expect(rspackConfigs[0].module?.parser).toMatchObject({
      'css/auto': {
        exportType: 'style',
      },
    });
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
