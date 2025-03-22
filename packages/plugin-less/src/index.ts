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
  lessOptions?: import('../compiled/less/index.js').default.Options;
  additionalData?:
    | string
    | ((
        content: string,
        loaderContext: Rspack.LoaderContext<LessLoaderOptions>,
      ) => string | Promise<string>);
  sourceMap?: boolean;
  webpackImporter?: boolean;
  implementation?: unknown;
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
      addExcludes: (items: string | RegExp | Array<string | RegExp>) => void;
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

  const addExcludes = (items: string | RegExp | Array<string | RegExp>) => {
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
    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment }) => {
      const { config } = environment;

      const ruleId = findRuleId(chain, CHAIN_ID.RULE.LESS);
      const test = pluginOptions.include ?? /\.less$/;
      const rule = chain.module
        .rule(ruleId)
        .test(test)
        .merge({ sideEffects: true })
        .resolve.preferRelative(true)
        .end()
        // exclude `import './foo.less?raw'`
        .resourceQuery({ not: /raw/ });

      // Support for importing raw Less files
      chain.module
        .rule(CHAIN_ID.RULE.LESS_RAW)
        .test(test)
        .type('asset/source')
        .resourceQuery(/raw/);

      const { sourceMap } = config.output;
      const { excludes, options } = getLessLoaderOptions(
        pluginOptions.lessLoaderOptions,
        typeof sourceMap === 'boolean' ? sourceMap : sourceMap.css,
        api.context.rootPath,
      );

      for (const item of excludes) {
        rule.exclude.add(item);
      }

      if (pluginOptions.exclude) {
        rule.exclude.add(pluginOptions.exclude);
      }

      // Copy the builtin CSS rules
      const cssRule = chain.module.rules.get(CHAIN_ID.RULE.CSS);
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

      rule
        .use(CHAIN_ID.USE.LESS)
        .loader(path.join(__dirname, '../compiled/less-loader/index.js'))
        .options(options);
    });
  },
});
