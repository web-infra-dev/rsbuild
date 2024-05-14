import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  type CompilerTapFn,
  type FileFilterUtil,
  SASS_REGEX,
  type SassLoaderOptions,
  type ToolsSassConfig,
  castArray,
  deepmerge,
  getSharedPkgCompiledPath,
  mergeChainedOptions,
} from '@rsbuild/shared';
import { getCompiledPath } from '../provider/shared';
import type { RsbuildPlugin } from '../types';

const GLOBAL_PATCHED_SYMBOL: unique symbol = Symbol('GLOBAL_PATCHED_SYMBOL');

declare global {
  interface Location {
    [GLOBAL_PATCHED_SYMBOL]?: true;
  }
}

/** fix issue about dart2js: https://github.com/dart-lang/sdk/issues/27979 */
function patchGlobalLocation() {
  if (!global.location) {
    const href = pathToFileURL(process.cwd()).href + path.sep;
    const location = Object.freeze({ [GLOBAL_PATCHED_SYMBOL]: true, href });
    global.location = location as unknown as Location;
  }
}

function unpatchGlobalLocation() {
  if (global.location?.[GLOBAL_PATCHED_SYMBOL]) {
    // @ts-expect-error
    delete global.location;
  }
}

export function patchCompilerGlobalLocation(compiler: {
  hooks: {
    run: CompilerTapFn;
    watchRun: CompilerTapFn;
    watchClose: CompilerTapFn;
    done: CompilerTapFn;
  };
}) {
  // https://github.com/webpack/webpack/blob/136b723023f8f26d71eabdd16badf04c1c8554e4/lib/MultiCompiler.js#L64
  compiler.hooks.run.tap('PatchGlobalLocation', patchGlobalLocation);
  compiler.hooks.watchRun.tap('PatchGlobalLocation', patchGlobalLocation);
  compiler.hooks.watchClose.tap('PatchGlobalLocation', unpatchGlobalLocation);
  compiler.hooks.done.tap('PatchGlobalLocation', unpatchGlobalLocation);
}

const getSassLoaderOptions = (
  rsbuildSassConfig: ToolsSassConfig | undefined,
  isUseCssSourceMap: boolean,
): {
  options: SassLoaderOptions;
  excludes: (RegExp | string)[];
} => {
  const excludes: (RegExp | string)[] = [];

  const addExcludes: FileFilterUtil = (items) => {
    excludes.push(...castArray(items));
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

  const mergedOptions = mergeChainedOptions({
    defaults: {
      sourceMap: isUseCssSourceMap,
      implementation: getSharedPkgCompiledPath('sass'),
    },
    options: rsbuildSassConfig,
    utils: { addExcludes },
    mergeFn,
  });

  return {
    options: mergedOptions,
    excludes,
  };
};

/**
 * fix resolve-url-loader can't deal with resolve.alias config
 *
 * reference: https://github.com/bholloway/resolve-url-loader/blob/e2695cde68f325f617825e168173df92236efb93/packages/resolve-url-loader/docs/advanced-features.md
 */
const getResolveUrlJoinFn = async () => {
  const {
    createJoinFunction,
    asGenerator,
    createJoinImplementation,
    defaultJoinGenerator,
  } = await import('../../compiled/resolve-url-loader');

  const rsbuildGenerator = asGenerator((item: any, ...rest: any[]) => {
    // only handle relative path (not absolutely accurate, but can meet common scenarios)
    if (!item.uri.startsWith('.')) {
      return [null];
    }
    return defaultJoinGenerator(item, ...rest);
  });
  return createJoinFunction(
    'rsbuild-resolve-join-fn',
    createJoinImplementation(rsbuildGenerator),
  );
};

export function pluginSass(): RsbuildPlugin {
  return {
    name: 'rsbuild:sass',
    setup(api) {
      api.onAfterCreateCompiler(({ compiler }) => {
        patchCompilerGlobalLocation(compiler);
      });

      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyCSSRule } = await import('./css');

        const { excludes, options } = getSassLoaderOptions(
          config.tools.sass,
          // source-maps required for loaders preceding resolve-url-loader
          // otherwise the resolve-url-loader will throw an error
          true,
        );

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.SASS)
          .test(SASS_REGEX);

        for (const item of excludes) {
          rule.exclude.add(item);
        }

        await applyCSSRule({
          rule,
          utils,
          config,
          context: api.context,
          // postcss-loader, resolve-url-loader, sass-loader
          importLoaders: 3,
        });

        rule
          .use(utils.CHAIN_ID.USE.RESOLVE_URL)
          .loader(getCompiledPath('resolve-url-loader'))
          .options({
            join: await getResolveUrlJoinFn(),
            // 'resolve-url-loader' relies on 'adjust-sourcemap-loader',
            // it has performance regression issues in some scenarios,
            // so we need to disable the sourceMap option.
            sourceMap: false,
          })
          .end()
          .use(utils.CHAIN_ID.USE.SASS)
          .loader(getSharedPkgCompiledPath('sass-loader'))
          .options(options);
      });
    },
  };
}
