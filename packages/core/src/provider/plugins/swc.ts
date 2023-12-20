import {
  logger,
  cloneDeep,
  isWebTarget,
  SCRIPT_REGEX,
  getJsSourceMap,
  getCoreJsVersion,
  applyScriptCondition,
  getBrowserslistWithDefault,
  type Polyfill,
  type BundlerChain,
  type RsbuildTarget,
  type BuiltinSwcLoaderOptions,
} from '@rsbuild/shared';
import path from 'path';
import type {
  RsbuildPlugin,
  NormalizedConfig,
  NormalizedSourceConfig,
} from '../../types';

const builtinSwcLoaderName = 'builtin:swc-loader';

export async function getDefaultSwcConfig(
  config: NormalizedConfig,
  rootPath: string,
  target: RsbuildTarget,
): Promise<BuiltinSwcLoaderOptions> {
  return {
    jsc: {
      externalHelpers: true,
      parser: {
        tsx: true,
        syntax: 'typescript',
        decorators: true,
      },
      // Avoid the webpack magic comment to be removed
      // https://github.com/swc-project/swc/issues/6403
      preserveAllComments: true,
    },
    isModule: 'unknown',
    minify: false, // for loader, we don't need to minify, we do minification using plugin
    env: {
      targets: await getBrowserslistWithDefault(rootPath, config, target),
    },
    sourceMaps: Boolean(getJsSourceMap(config)),
    exclude: [],
    inlineSourcesContent: true,
  };
}

/**
 * Provide some swc configs of rspack
 */
export const pluginSwc = (): RsbuildPlugin => ({
  name: 'rsbuild:swc',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, target }) => {
      const config = api.getNormalizedConfig();

      const rule = chain.module
        .rule(CHAIN_ID.RULE.JS)
        .test(SCRIPT_REGEX)
        .type('javascript/auto');

      applyScriptCondition({
        rule,
        config,
        context: api.context,
        includes: [],
        excludes: [],
      });

      const swcConfig = await getDefaultSwcConfig(
        config,
        api.context.rootPath,
        target,
      );

      applyTransformImport(swcConfig, config.source.transformImport);

      applyDecorator(swcConfig, config.output.enableLatestDecorators);

      // apply polyfill
      if (isWebTarget(target)) {
        const polyfillMode = config.output.polyfill;

        if (polyfillMode === 'off' || polyfillMode === 'ua') {
          swcConfig.env!.mode = undefined;
        } else {
          swcConfig.env!.mode = polyfillMode;
          /* Apply core-js version and path alias and exclude core-js */
          await applyCoreJs(swcConfig, chain, polyfillMode);
        }
      }

      rule
        .use(CHAIN_ID.USE.SWC)
        .loader(builtinSwcLoaderName)
        .options(swcConfig);

      /**
       * If a script is imported with data URI, it can be compiled by babel too.
       * This is used by some frameworks to create virtual entry.
       * https://webpack.js.org/api/module-methods/#import
       * @example: import x from 'data:text/javascript,export default 1;';
       */
      chain.module
        .rule(CHAIN_ID.RULE.JS_DATA_URI)
        .mimetype({
          or: ['text/javascript', 'application/javascript'],
        })
        .use(CHAIN_ID.USE.SWC)
        .loader(builtinSwcLoaderName)
        // Using cloned options to keep options separate from each other
        .options(cloneDeep(swcConfig));
    });
  },
});

async function applyCoreJs(
  swcConfig: BuiltinSwcLoaderOptions,
  chain: BundlerChain,
  polyfillMode: Polyfill,
) {
  const coreJsPath = require.resolve('core-js/package.json');
  const version = getCoreJsVersion(coreJsPath);
  const coreJsDir = path.dirname(coreJsPath);

  swcConfig.env!.coreJs = version;

  if (polyfillMode === 'usage') {
    // enable esnext polyfill
    // reference: https://github.com/swc-project/swc/blob/b43e38d3f92bc889e263b741dbe173a6f2206d88/crates/swc_ecma_preset_env/src/corejs3/usage.rs#L75
    swcConfig.env!.shippedProposals = true;
  }

  chain.resolve.alias.merge({
    'core-js': coreJsDir,
  });
}

function applyTransformImport(
  swcConfig: BuiltinSwcLoaderOptions,
  pluginImport?: NormalizedSourceConfig['transformImport'],
) {
  if (pluginImport !== false && pluginImport) {
    swcConfig.rspackExperiments ??= {};
    swcConfig.rspackExperiments.import ??= [];
    swcConfig.rspackExperiments.import.push(...pluginImport);
  }
}

function applyDecorator(
  swcConfig: BuiltinSwcLoaderOptions,
  enableLatestDecorators: boolean,
) {
  /**
   * SWC can't use latestDecorator in TypeScript file for now
   */
  if (enableLatestDecorators) {
    logger.warn('Cannot use latestDecorator in Rspack mode.');
  }

  swcConfig.jsc!.transform ??= {};
  swcConfig.jsc!.transform.legacyDecorator = true;
  swcConfig.jsc!.transform.decoratorMetadata = true;
}
