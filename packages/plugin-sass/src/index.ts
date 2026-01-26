import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RsbuildPlugin, RspackChain } from '@rsbuild/core';
import deepmerge from 'deepmerge';
import { reduceConfigsWithContext } from 'reduce-configs';
import { getResolveUrlJoinFn, patchCompilerGlobalLocation } from './helpers.js';
import type { PluginSassOptions, SassLoaderOptions } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export const PLUGIN_SASS_NAME = 'rsbuild:sass';

export type { PluginSassOptions };

const getSassLoaderOptions = (
  userOptions: PluginSassOptions['sassLoaderOptions'],
  isUseCssSourceMap: boolean,
): {
  options: SassLoaderOptions;
  excludes: (RegExp | string)[];
} => {
  const excludes: (RegExp | string)[] = [];

  const addExcludes = (items: string | RegExp | (string | RegExp)[]) => {
    excludes.push(...(Array.isArray(items) ? items : [items]));
  };

  const mergeFn = (
    defaults: SassLoaderOptions,
    userOptions: SassLoaderOptions,
  ) => {
    const getSassOptions = () => {
      if (defaults.sassOptions && userOptions.sassOptions) {
        return deepmerge<SassLoaderOptions['sassOptions']>(
          defaults.sassOptions,
          userOptions.sassOptions,
        );
      }
      return userOptions.sassOptions || defaults.sassOptions;
    };

    return {
      ...defaults,
      ...userOptions,
      sassOptions: getSassOptions(),
    };
  };

  const mergedOptions = reduceConfigsWithContext({
    initial: {
      sourceMap: isUseCssSourceMap,
      api: 'modern-compiler',
      implementation: require.resolve('sass-embedded'),
      sassOptions: {
        // mute deprecation warnings of dependencies
        quietDeps: true,
      },
    },
    config: userOptions,
    ctx: { addExcludes },
    mergeFn,
  });

  mergedOptions.sassOptions ||= {};

  if (!mergedOptions.sassOptions.silenceDeprecations) {
    // `import` is widely used and will not be removed within two years
    mergedOptions.sassOptions.silenceDeprecations = ['import'];

    if (mergedOptions.api === 'legacy') {
      // mute the noisy legacy API deprecation warnings
      mergedOptions.sassOptions.silenceDeprecations.push('legacy-js-api');
    }
  }

  return {
    options: mergedOptions,
    excludes,
  };
};

// Find a unique rule id for the sass rule,
// this allows to add multiple sass rules.
const findRuleId = (chain: RspackChain, defaultId: string) => {
  let id = defaultId;
  let index = 0;
  while (chain.module.rules.has(id)) {
    id = `${defaultId}-${++index}`;
  }
  return id;
};

export const pluginSass = (
  pluginOptions: PluginSassOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_SASS_NAME,

  setup(api) {
    const { rewriteUrls = true, include = /\.s(?:a|c)ss$/ } = pluginOptions;

    const CSS_MAIN = 'css-main';
    const CSS_INLINE = 'css-inline';
    const CSS_RAW = 'css-raw';
    const SASS_MAIN = 'sass-main';
    const SASS_INLINE = 'sass-inline';
    const SASS_RAW = 'sass-raw';
    const isV1 = api.context.version.startsWith('1.');

    api.onAfterCreateCompiler(({ compiler }) => {
      patchCompilerGlobalLocation(compiler);
    });

    api.modifyBundlerChain((chain, { CHAIN_ID, environment }) => {
      const { config } = environment;
      const { sourceMap } = config.output;
      const isUseSourceMap =
        typeof sourceMap === 'boolean' ? sourceMap : sourceMap.css;

      const { excludes, options } = getSassLoaderOptions(
        pluginOptions.sassLoaderOptions,
        // If `rewriteUrls` is true, source maps are required for loaders that run before
        // `resolve-url-loader`, otherwise the `resolve-url-loader` will throw an error.
        rewriteUrls ? true : isUseSourceMap,
      );

      const sassRule = chain.module
        .rule(findRuleId(chain, CHAIN_ID.RULE.SASS))
        .test(include)
        .dependency({ not: 'url' })
        .resolve.preferRelative(true)
        .end();

      if (isV1) {
        chain.module.rule(SASS_RAW).test(include);
        chain.module.rule(SASS_INLINE).test(include);
      }

      const getRule = (id: string) => {
        // Compatibility for Rsbuild v1
        if (isV1) {
          // Map `css-main` to `css` in v1
          return chain.module.rule(id.replace('-main', ''));
        }
        return (
          id.startsWith('sass-')
            ? sassRule
            : chain.module.rule(CHAIN_ID.RULE.CSS)
        ).oneOf(id);
      };

      // Inline Sass for `?inline` imports
      const sassInlineRule = getRule(SASS_INLINE);

      // Raw Sass for `?raw` imports
      getRule(SASS_RAW)
        .type('asset/source')
        .resourceQuery(getRule(CSS_RAW).get('resourceQuery'));

      // Main Sass transform
      const sassMainRule = getRule(SASS_MAIN);

      // Update the main rule and the inline rule
      const updateRules = (
        callback: (
          rule: RspackChain.Rule<unknown>,
          cssBranchRule: RspackChain.Rule<unknown>,
        ) => void,
      ) => {
        callback(sassMainRule, getRule(CSS_MAIN));
        callback(sassInlineRule, getRule(CSS_INLINE));
      };

      const sassLoaderPath = path.join(
        __dirname,
        '../compiled/sass-loader/index.js',
      );

      const resolveUrlLoaderPath = path.join(
        __dirname,
        '../compiled/resolve-url-loader/index.js',
      );

      const resolveUrlLoaderOptions = {
        join: getResolveUrlJoinFn(),
        // 'resolve-url-loader' relies on 'adjust-sourcemap-loader',
        // it has performance regression issues in some scenarios,
        // so we need to disable the sourceMap option.
        sourceMap: false,
      };

      updateRules((rule, cssBranchRule) => {
        for (const item of excludes) {
          rule.exclude.add(item);
        }
        if (pluginOptions.exclude) {
          rule.exclude.add(pluginOptions.exclude);
        }

        // Copy the builtin CSS rules
        rule
          .sideEffects(cssBranchRule.get('sideEffects'))
          .resourceQuery(cssBranchRule.get('resourceQuery'));

        for (const id of Object.keys(cssBranchRule.uses.entries())) {
          const loader = cssBranchRule.uses.get(id);
          const options = loader.get('options') ?? {};
          const clonedOptions = deepmerge<Record<string, any>>({}, options);

          if (id === CHAIN_ID.USE.CSS) {
            // add sass-loader and resolve-url-loader
            clonedOptions.importLoaders += rewriteUrls ? 2 : 1;
          }

          rule.use(id).loader(loader.get('loader')).options(clonedOptions);
        }

        // use `resolve-url-loader` to rewrite urls
        if (rewriteUrls) {
          rule
            .use(CHAIN_ID.USE.RESOLVE_URL)
            .loader(resolveUrlLoaderPath)
            .options(resolveUrlLoaderOptions)
            .end();
        }

        rule.use(CHAIN_ID.USE.SASS).loader(sassLoaderPath).options(options);
      });
    });
  },
});
