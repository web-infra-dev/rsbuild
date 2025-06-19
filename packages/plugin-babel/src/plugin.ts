import fs from 'node:fs';
import { createRequire } from 'node:module';
import path, { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  EnvironmentContext,
  NormalizedEnvironmentConfig,
  RsbuildContext,
  RsbuildPlugin,
} from '@rsbuild/core';
import deepmerge from 'deepmerge';
import { applyUserBabelConfig, BABEL_JS_RULE, castArray } from './helper.js';
import type { BabelLoaderOptions, PluginBabelOptions } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export const PLUGIN_BABEL_NAME = 'rsbuild:babel';
const SCRIPT_REGEX = /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;

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
  let identifier = `${process.env.NODE_ENV}${JSON.stringify(options)}`;

  const { version: coreVersion } = await import('@babel/core');
  const rawPkgJson = await fs.promises.readFile(
    join(__dirname, '../compiled/babel-loader/package.json'),
    'utf-8',
  );
  const loaderVersion: string = JSON.parse(rawPkgJson).version ?? '';

  identifier += `@babel/core@${coreVersion}`;
  identifier += `babel-loader@${loaderVersion}`;

  return identifier;
}

export const getDefaultBabelOptions = (
  config: NormalizedEnvironmentConfig,
  context: RsbuildContext,
): BabelLoaderOptions => {
  const isLegacyDecorators = config.source.decorators.version === 'legacy';

  const options: BabelLoaderOptions = {
    babelrc: false,
    configFile: false,
    compact: config.mode === 'production',
    plugins: [
      [
        require.resolve('@babel/plugin-proposal-decorators'),
        config.source.decorators,
      ],
      // If you are using @babel/preset-env and legacy decorators, you must ensure the class elements transform is enabled regardless of your targets, because Babel only supports compiling legacy decorators when also compiling class properties:
      // see https://babeljs.io/docs/babel-plugin-proposal-decorators#legacy
      ...(isLegacyDecorators
        ? [require.resolve('@babel/plugin-transform-class-properties')]
        : []),
    ],
    presets: [
      // TODO: only apply preset-typescript for ts file (isTSX & allExtensions false)
      [
        require.resolve('@babel/preset-typescript'),
        DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS,
      ],
    ],
  };

  const { buildCache = true } = config.performance;

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
    const getBabelOptions = async (environment: EnvironmentContext) => {
      const { config } = environment;
      const baseOptions = getDefaultBabelOptions(config, api.context);

      const mergedOptions = applyUserBabelConfig(
        deepmerge({}, baseOptions),
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
      handler: async (chain, { CHAIN_ID, environment }) => {
        const babelOptions = await getBabelOptions(environment);
        const babelLoader = path.resolve(
          __dirname,
          '../compiled/babel-loader/index.js',
        );
        const { include, exclude } = options;

        if (include || exclude) {
          const rule = chain.module
            .rule(BABEL_JS_RULE)
            // run babel loader before the builtin SWC loader
            // https://stackoverflow.com/questions/32234329/what-is-the-loader-order-for-webpack
            .after(CHAIN_ID.RULE.JS);

          if (include) {
            for (const condition of castArray(include)) {
              rule.include.add(condition);
            }
          }
          if (exclude) {
            for (const condition of castArray(exclude)) {
              rule.exclude.add(condition);
            }
          }

          rule
            .test(SCRIPT_REGEX)
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
