import path, { isAbsolute, join } from 'node:path';
import type {
  RsbuildPlugin,
  RsbuildContext,
  NormalizedConfig,
} from '@rsbuild/core';
import {
  fse,
  isProd,
  castArray,
  cloneDeep,
  getNodeEnv,
  SCRIPT_REGEX,
} from '@rsbuild/shared';
import { applyUserBabelConfig, BABEL_JS_RULE } from './helper';
import type { BabelLoaderOptions, PluginBabelOptions } from './types';

export const PLUGIN_BABEL_NAME = 'rsbuild:babel';

/**
 * The `@babel/preset-typescript` default options.
 */
export const DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS = {
  allowNamespaces: true,
  allExtensions: true,
  allowDeclareFields: true,
  // aligns Babel's behavior with TypeScript's default behavior.
  // https://babeljs.io/docs/en/babel-preset-typescript#optimizeconstenums
  optimizeConstEnums: true,
  isTSX: true,
};

function getCacheDirectory(context: RsbuildContext, cacheDirectory?: string) {
  if (cacheDirectory) {
    return isAbsolute(cacheDirectory)
      ? cacheDirectory
      : join(context.rootPath, cacheDirectory);
  }
  return join(context.cachePath);
}

async function getCacheIdentifier(options: BabelLoaderOptions) {
  let identifier = `${getNodeEnv()}${JSON.stringify(options)}`;

  const { version: coreVersion } = await import('@babel/core');
  const loaderVersion = (
    await fse.readJSON(join(__dirname, '../compiled/babel-loader/package.json'))
  ).version;

  identifier += `@babel/core@${coreVersion}`;
  identifier += `babel-loader@${loaderVersion}`;

  return identifier;
}

export const getDefaultBabelOptions = (
  config: NormalizedConfig,
  context: RsbuildContext,
): BabelLoaderOptions => {
  const options: BabelLoaderOptions = {
    babelrc: false,
    configFile: false,
    compact: isProd(),
    plugins: [
      [
        require.resolve('@babel/plugin-proposal-decorators'),
        config.source.decorators,
      ],
    ],
    presets: [
      // TODO: only apply preset-typescript for ts file (isTSX & allExtensions false)
      [
        require.resolve('@babel/preset-typescript'),
        DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS,
      ],
    ],
  };

  const { buildCache } = config.performance;

  // Rspack does not yet support persistent cache
  // so we use babel-loader's cache to improve rebuild performance
  if (buildCache && context.bundlerType === 'rspack') {
    const cacheDirectory = getCacheDirectory(
      context,
      typeof buildCache === 'boolean' ? undefined : buildCache.cacheDirectory,
    );

    // turn off compression to reduce overhead
    options.cacheCompression = false;
    options.cacheDirectory = join(cacheDirectory, 'babel-loader');
  }

  return options;
};

export const pluginBabel = (
  options: PluginBabelOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_BABEL_NAME,

  setup(api) {
    const getBabelOptions = async () => {
      const config = api.getNormalizedConfig();
      const baseOptions = getDefaultBabelOptions(config, api.context);

      const mergedOptions = applyUserBabelConfig(
        cloneDeep(baseOptions),
        options.babelLoaderOptions,
      );

      // calculate cacheIdentifier with the merged options
      if (mergedOptions.cacheDirectory && !mergedOptions.cacheIdentifier) {
        mergedOptions.cacheIdentifier = await getCacheIdentifier(mergedOptions);
      }

      return mergedOptions;
    };

    api.modifyBundlerChain({
      order: 'pre',
      handler: async (chain, { CHAIN_ID }) => {
        const babelOptions = await getBabelOptions();
        const babelLoader = path.resolve(
          __dirname,
          '../compiled/babel-loader/index.js',
        );
        const { include, exclude } = options;

        if (include || exclude) {
          const rule = chain.module.rule(BABEL_JS_RULE);

          if (include) {
            castArray(include).forEach((condition) => {
              rule.include.add(condition);
            });
          }
          if (exclude) {
            castArray(exclude).forEach((condition) => {
              rule.exclude.add(condition);
            });
          }

          const swcRule = chain.module.rules
            .get(CHAIN_ID.RULE.JS)
            .use(CHAIN_ID.USE.SWC);
          const swcLoader = swcRule.get('loader');
          const swcOptions = swcRule.get('options');

          rule
            .test(SCRIPT_REGEX)
            .use(CHAIN_ID.USE.SWC)
            .loader(swcLoader)
            .options(swcOptions)
            .end()
            .use(CHAIN_ID.USE.BABEL)
            .loader(babelLoader)
            .options(babelOptions);
        } else {
          // already set source.include / exclude in plugin-swc
          const rule = chain.module.rule(CHAIN_ID.RULE.JS);
          rule
            .test(SCRIPT_REGEX)
            .use(CHAIN_ID.USE.BABEL)
            .after(CHAIN_ID.USE.SWC)
            .loader(babelLoader)
            .options(babelOptions);
        }
      },
    });
  },
});
