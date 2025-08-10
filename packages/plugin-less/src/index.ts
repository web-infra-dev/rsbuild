import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ConfigChainWithContext,
  RsbuildPlugin,
  Rspack,
  RspackChain,
} from '@rsbuild/core';
import deepmerge from 'deepmerge';
import { reduceConfigsWithContext } from 'reduce-configs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const isPlainObject = (obj: unknown): obj is Record<string, any> => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Object.getPrototypeOf(obj) === Object.prototype
  );
};

export const PLUGIN_LESS_NAME = 'rsbuild:less';

export type LessLoaderOptions = {
  /**
   * Options passed to less.
   * @see https://lesscss.org/usage/#less-options
   */
  lessOptions?: import('../compiled/less/index.js').default.Options;
  /**
   * Prepends or appends Less code to the actual entry file.
   * This is especially useful when some of your Less variables
   * depend on the environment.
   */
  additionalData?:
    | string
    | ((
        content: string,
        loaderContext: Rspack.LoaderContext<LessLoaderOptions>,
      ) => string | Promise<string>);
  /**
   * Whether to source map generation.
   * @default depends on the `devtool` value of Rspack
   */
  sourceMap?: boolean;
  /**
   * Enables or disables the built-in Rspack resolver.
   * - If disabled, aliases and `@import` from node_modules will not work.
   * - If set to `only`, only the built-in Rspack resolver will be used
   * and `resolve.extensionAlias` can work.
   * @default true
   */
  webpackImporter?: boolean | 'only';
  /**
   * Determines which implementation of Less to use.
   * Can be used to override the pre-bundled version of less.
   * @default "@rsbuild/plugin-less/compiled/less/index.js"
   */
  implementation?: unknown;
  /**
   * If enabled, Less warnings and errors will be treated as Rspack warnings
   * and errors, instead of being logged silently.
   *
   * If `lessLogAsWarnOrErr` is set to false it will be just a log and Rspack
   * will compile successfully, but if you set this option to true, Rspack
   * will compile fail with a warning(or error), and can break the build if
   * configured accordingly.
   * @default false
   */
  lessLogAsWarnOrErr?: boolean;
};

export type PluginLessOptions = {
  /**
   * Options passed to less-loader.
   * @see https://github.com/webpack-contrib/less-loader
   */
  lessLoaderOptions?: ConfigChainWithContext<
    LessLoaderOptions,
    {
      /**
       * @deprecated
       * use `exclude` option instead.
       */
      addExcludes: (items: string | RegExp | (string | RegExp)[]) => void;
    }
  >;

  /**
   * Include some `.less` files, they will be transformed by less-loader.
   * @default /\.less$/
   */
  include?: Rspack.RuleSetCondition;

  /**
   * Exclude some `.less` files, they will not be transformed by less-loader.
   * @default undefined
   */
  exclude?: Rspack.RuleSetCondition;
};

const getLessLoaderOptions = (
  userOptions: PluginLessOptions['lessLoaderOptions'],
  isUseCssSourceMap: boolean,
  rootPath: string,
) => {
  const excludes: (RegExp | string)[] = [];

  const addExcludes = (items: string | RegExp | (string | RegExp)[]) => {
    excludes.push(...(Array.isArray(items) ? items : [items]));
  };

  const defaultLessLoaderOptions: LessLoaderOptions = {
    lessOptions: {
      javascriptEnabled: true,
      // let less resolve from node_modules in the current root directory,
      // Avoid resolving from wrong node_modules.
      paths: [path.join(rootPath, 'node_modules')],
    },
    sourceMap: isUseCssSourceMap,
    implementation: path.join(__dirname, '../compiled/less/index.js'),
  };

  const mergeFn = (
    defaults: LessLoaderOptions,
    userOptions: LessLoaderOptions,
  ): LessLoaderOptions => {
    const getLessOptions = () => {
      if (defaults.lessOptions && userOptions.lessOptions) {
        return deepmerge(defaults.lessOptions, userOptions.lessOptions, {
          isMergeableObject: isPlainObject,
        });
      }
      return userOptions.lessOptions || defaults.lessOptions;
    };

    return {
      ...defaults,
      ...userOptions,
      lessOptions: getLessOptions(),
    };
  };

  const mergedOptions = reduceConfigsWithContext({
    initial: defaultLessLoaderOptions,
    config: userOptions,
    ctx: { addExcludes },
    mergeFn,
  });

  return {
    options: mergedOptions,
    excludes,
  };
};

// Find a unique rule id for the less rule,
// this allows to add multiple less rules.
const findRuleId = (chain: RspackChain, defaultId: string) => {
  let id = defaultId;
  let index = 0;
  while (chain.module.rules.has(id)) {
    id = `${defaultId}-${++index}`;
  }
  return id;
};

export const pluginLess = (
  pluginOptions: PluginLessOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_LESS_NAME,

  setup(api) {
    const { include = /\.less$/ } = pluginOptions;
    const RAW_QUERY_REGEX: RegExp = /^\?raw$/;
    const INLINE_QUERY_REGEX: RegExp = /^\?inline$/;

    api.modifyBundlerChain((chain, { CHAIN_ID, environment }) => {
      const { config } = environment;

      const lessRule = chain.module
        .rule(findRuleId(chain, CHAIN_ID.RULE.LESS))
        .test(include)
        // exclude `import './foo.less?raw'` and `import './foo.less?inline'`
        .resourceQuery({ not: [RAW_QUERY_REGEX, INLINE_QUERY_REGEX] })
        .sideEffects(true)
        .resolve.preferRelative(true)
        .end();

      // Rsbuild < 1.3.0 does not have CSS inline rule
      const supportInline =
        CHAIN_ID.RULE.CSS_INLINE &&
        chain.module.rules.has(CHAIN_ID.RULE.CSS_INLINE);

      const inlineRule = supportInline
        ? chain.module
            .rule(findRuleId(chain, CHAIN_ID.RULE.LESS_INLINE))
            .test(include)
            .resourceQuery(INLINE_QUERY_REGEX)
        : null;

      // Support for importing raw Less files
      chain.module
        .rule(CHAIN_ID.RULE.LESS_RAW)
        .test(include)
        .type('asset/source')
        .resourceQuery(RAW_QUERY_REGEX);

      const { sourceMap } = config.output;
      const { excludes, options } = getLessLoaderOptions(
        pluginOptions.lessLoaderOptions,
        typeof sourceMap === 'boolean' ? sourceMap : sourceMap.css,
        api.context.rootPath,
      );

      // Update the normal rule and the inline rule
      const updateRules = (
        callback: (rule: RspackChain.Rule, type: 'normal' | 'inline') => void,
      ) => {
        callback(lessRule, 'normal');
        if (inlineRule) {
          callback(inlineRule, 'inline');
        }
      };

      const lessLoaderPath = path.join(
        __dirname,
        '../compiled/less-loader/index.js',
      );

      updateRules((rule, type) => {
        for (const item of excludes) {
          rule.exclude.add(item);
        }
        if (pluginOptions.exclude) {
          rule.exclude.add(pluginOptions.exclude);
        }

        // Copy the builtin CSS rules
        const cssRule = chain.module.rules.get(
          type === 'normal' ? CHAIN_ID.RULE.CSS : CHAIN_ID.RULE.CSS_INLINE,
        );
        rule.dependency(cssRule.get('dependency'));

        for (const id of Object.keys(cssRule.uses.entries())) {
          const loader = cssRule.uses.get(id);
          const options = loader.get('options') ?? {};
          const clonedOptions = deepmerge<Record<string, any>>({}, options);

          if (id === CHAIN_ID.USE.CSS) {
            // add less-loader
            clonedOptions.importLoaders += 1;
          }

          rule.use(id).loader(loader.get('loader')).options(clonedOptions);
        }

        rule.use(CHAIN_ID.USE.LESS).loader(lessLoaderPath).options(options);
      });
    });
  },
});
