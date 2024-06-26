import fs from 'node:fs';
import path from 'node:path';
import {
  type Polyfill,
  SCRIPT_REGEX,
  applyScriptCondition,
  cloneDeep,
  deepmerge,
} from '@rsbuild/shared';
import type { SwcLoaderOptions } from '@rspack/core';
import { PLUGIN_SWC_NAME } from '../constants';
import { isWebTarget } from '../helpers';
import { reduceConfigs } from '../reduceConfigs';
import type {
  NormalizedEnvironmentConfig,
  NormalizedSourceConfig,
  RsbuildPlugin,
} from '../types';

const builtinSwcLoaderName = 'builtin:swc-loader';

function getDefaultSwcConfig(browserslist: string[]): SwcLoaderOptions {
  return {
    jsc: {
      externalHelpers: true,
      parser: {
        tsx: false,
        syntax: 'typescript',
        decorators: true,
      },
      // Avoid the webpack magic comment to be removed
      // https://github.com/swc-project/swc/issues/6403
      preserveAllComments: true,
    },
    isModule: 'unknown',
    env: {
      targets: browserslist,
    },
  };
}

/**
 * Provide some swc configs of rspack
 */
export const pluginSwc = (): RsbuildPlugin => ({
  name: PLUGIN_SWC_NAME,

  setup(api) {
    // This plugin uses Rspack builtin SWC and is not suitable for webpack
    if (api.context.bundlerType === 'webpack') {
      return;
    }

    api.modifyBundlerChain({
      order: 'pre',
      handler: async (chain, { CHAIN_ID, target, environment }) => {
        const config = api.getNormalizedConfig({ environment });

        const rule = chain.module
          .rule(CHAIN_ID.RULE.JS)
          .test(SCRIPT_REGEX)
          .type('javascript/auto');

        const dataUriRule = chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .mimetype({
            or: ['text/javascript', 'application/javascript'],
          });

        applyScriptCondition({
          rule,
          chain,
          config,
          context: api.context,
          includes: [],
          excludes: [],
        });

        const { browserslist } = api.context.environments[environment];

        const swcConfig = getDefaultSwcConfig(browserslist);

        applyTransformImport(swcConfig, config.source.transformImport);
        applySwcDecoratorConfig(swcConfig, config);

        if (swcConfig.jsc?.externalHelpers) {
          chain.resolve.alias.set(
            '@swc/helpers',
            path.dirname(require.resolve('@swc/helpers/package.json')),
          );
        }

        // apply polyfill
        if (isWebTarget(target)) {
          const polyfillMode = config.output.polyfill;

          if (polyfillMode === 'off') {
            swcConfig.env!.mode = undefined;
          } else {
            swcConfig.env!.mode = polyfillMode;

            const coreJsDir = await applyCoreJs(swcConfig, polyfillMode);
            for (const item of [rule, dataUriRule]) {
              item.resolve.alias.set('core-js', coreJsDir);
            }
          }
        }

        const mergedSwcConfig = reduceConfigs({
          initial: swcConfig,
          config: config.tools.swc,
          mergeFn: deepmerge,
        });

        rule
          .use(CHAIN_ID.USE.SWC)
          .loader(builtinSwcLoaderName)
          .options(mergedSwcConfig);

        /**
         * If a script is imported with data URI, it can be compiled by babel too.
         * This is used by some frameworks to create virtual entry.
         * https://webpack.js.org/api/module-methods/#import
         * @example: import x from 'data:text/javascript,export default 1;';
         */
        dataUriRule.resolve
          // https://github.com/webpack/webpack/issues/11467
          // compatible with legacy packages with type="module"
          .set('fullySpecified', false)
          .end()
          .use(CHAIN_ID.USE.SWC)
          .loader(builtinSwcLoaderName)
          // Using cloned options to keep options separate from each other
          .options(cloneDeep(mergedSwcConfig));
      },
    });
  },
});

const getCoreJsVersion = (corejsPkgPath: string) => {
  try {
    const rawJson = fs.readFileSync(corejsPkgPath, 'utf-8');
    const { version } = JSON.parse(rawJson);
    const [major, minor] = version.split('.');
    return `${major}.${minor}`;
  } catch (err) {
    return '3';
  }
};

async function applyCoreJs(
  swcConfig: SwcLoaderOptions,
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

  return coreJsDir;
}

function applyTransformImport(
  swcConfig: SwcLoaderOptions,
  pluginImport?: NormalizedSourceConfig['transformImport'],
) {
  if (pluginImport !== false && pluginImport) {
    swcConfig.rspackExperiments ??= {};
    swcConfig.rspackExperiments.import ??= [];
    swcConfig.rspackExperiments.import.push(...pluginImport);
  }
}

export function applySwcDecoratorConfig(
  swcConfig: SwcLoaderOptions,
  config: NormalizedEnvironmentConfig,
): void {
  swcConfig.jsc ||= {};
  swcConfig.jsc.transform ||= {};

  const { version } = config.source.decorators;

  switch (version) {
    case 'legacy':
      swcConfig.jsc.transform.legacyDecorator = true;
      swcConfig.jsc.transform.decoratorMetadata = true;
      // see: https://github.com/swc-project/swc/issues/6571
      swcConfig.jsc.transform.useDefineForClassFields = false;
      break;
    case '2022-03':
      swcConfig.jsc.transform.legacyDecorator = false;
      swcConfig.jsc.transform.decoratorVersion = '2022-03';
      break;
    default:
      throw new Error('Unknown decorators version: ${version}');
  }
}
