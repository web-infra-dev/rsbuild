import {
  logger,
  JS_REGEX,
  TS_REGEX,
  mergeRegex,
  setConfig,
  isWebTarget,
  addCoreJsEntry,
  isUseJsSourceMap,
  getCoreJsVersion,
  applyScriptCondition,
  getBrowserslistWithDefault,
  type Polyfill,
  type BundlerChain,
  type RsbuildTarget,
  type BundlerChainRule,
  type BuiltinSwcLoaderOptions,
} from '@rsbuild/shared';
import { cloneDeep } from 'lodash';
import * as path from 'path';
import type {
  RsbuildPlugin,
  NormalizedConfig,
  NormalizedSourceConfig,
} from '../types';

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
      // TODO: Enabling it will cause performance degradation
      // Avoid the webpack magic comment to be removed
      // https://github.com/swc-project/swc/issues/6403
      // preserveAllComments: true,
    },
    isModule: 'unknown',
    minify: false, // for loader, we don't need to minify, we do minification using plugin
    env: {
      targets: await getBrowserslistWithDefault(rootPath, config, target),
    },
    sourceMaps: isUseJsSourceMap(config),
    exclude: [],
    inlineSourcesContent: true,
  };
}

/**
 * Provide some swc configs of rspack
 */
export const pluginSwc = (): RsbuildPlugin => ({
  name: 'plugin-swc',

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, target, isServer, isServiceWorker }) => {
        const config = api.getNormalizedConfig();

        addCoreJsEntry({
          chain,
          config,
          isServer,
          isServiceWorker,
        });

        const rule = chain.module
          .rule(CHAIN_ID.RULE.JS)
          .test(mergeRegex(JS_REGEX, TS_REGEX))
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
            await applyCoreJs(swcConfig, chain, rule, polyfillMode);
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
        if (config.source.compileJsDataURI) {
          chain.module
            .rule(CHAIN_ID.RULE.JS_DATA_URI)
            .mimetype({
              or: ['text/javascript', 'application/javascript'],
            })
            .use(CHAIN_ID.USE.SWC)
            .loader(builtinSwcLoaderName)
            // Using cloned options to keep options separate from each other
            .options(cloneDeep(swcConfig));
        }
      },
    );

    api.modifyRspackConfig(async (config) => {
      // will default in rspack 0.4.0 / 0.5.0
      setConfig(
        config,
        'experiments.rspackFuture.disableTransformByDefault',
        true,
      );
    });
  },
});

async function applyCoreJs(
  swcConfig: BuiltinSwcLoaderOptions,
  chain: BundlerChain,
  rule: BundlerChainRule,
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

  rule.exclude.add(coreJsDir);
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
