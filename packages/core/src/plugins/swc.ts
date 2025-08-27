import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { SwcLoaderOptions } from '@rspack/core';
import deepmerge from 'deepmerge';
import { reduceConfigs } from 'reduce-configs';
import {
  NODE_MODULES_REGEX,
  PLUGIN_SWC_NAME,
  RAW_QUERY_REGEX,
  SCRIPT_REGEX,
} from '../constants';
import {
  castArray,
  cloneDeep,
  color,
  isFunction,
  isWebTarget,
} from '../helpers';
import type {
  NormalizedEnvironmentConfig,
  NormalizedSourceConfig,
  Polyfill,
  RsbuildPlugin,
  RsbuildTarget,
  RspackChain,
  TransformImport,
} from '../types';

const require = createRequire(import.meta.url);

const builtinSwcLoaderName = 'builtin:swc-loader';

function applyScriptCondition({
  rule,
  isDev,
  config,
  rsbuildTarget,
}: {
  rule: RspackChain.Rule;
  isDev: boolean;
  config: NormalizedEnvironmentConfig;
  rsbuildTarget: RsbuildTarget;
}): void {
  // compile all modules in the app directory, exclude node_modules
  rule.include.add({ not: NODE_MODULES_REGEX });

  // always compile TS and JSX files.
  // otherwise, it may cause compilation errors and incorrect output
  rule.include.add(/\.(?:ts|tsx|jsx|mts|cts)$/);

  // transform the Rsbuild runtime code to support legacy browsers
  if (rsbuildTarget === 'web' && isDev) {
    rule.include.add(/[\\/]@rsbuild[\\/]core[\\/]dist[\\/]/);
  }

  for (const condition of config.source.include || []) {
    rule.include.add(condition);
  }

  for (const condition of config.source.exclude || []) {
    rule.exclude.add(condition);
  }
}

function getDefaultSwcConfig({
  browserslist,
  cacheRoot,
  config,
}: {
  browserslist: string[];
  cacheRoot: string;
  config: NormalizedEnvironmentConfig;
}): SwcLoaderOptions {
  return {
    jsc: {
      externalHelpers: true,
      parser: {
        tsx: false,
        syntax: 'typescript',
        decorators: true,
      },
      experimental: {
        cacheRoot,
        /**
         * Preserve `with` in imports and exports.
         */
        keepImportAttributes: true,
      },
      output: {
        charset: config.output.charset,
      },
    },
    isModule: 'unknown',
    env: {
      targets: browserslist,
    },
    rspackExperiments: {
      collectTypeScriptInfo: {
        typeExports: true,
        exportedEnum: true,
      },
    },
  };
}

/**
 * Provide some SWC configs of Rspack
 */
export const pluginSwc = (): RsbuildPlugin => ({
  name: PLUGIN_SWC_NAME,

  setup(api) {
    api.modifyBundlerChain({
      order: 'pre',
      handler: (chain, { CHAIN_ID, isDev, target, environment }) => {
        const { config, browserslist } = environment;
        const cacheRoot = path.join(api.context.cachePath, '.swc');

        const rule = chain.module
          .rule(CHAIN_ID.RULE.JS)
          .test(SCRIPT_REGEX)
          // When using `new URL('./path/to/foo.js', import.meta.url)`,
          // the module should be treated as an asset module rather than a JS module.
          .dependency({ not: 'url' })
          // exclude `import './foo.js?raw'`
          .resourceQuery({ not: RAW_QUERY_REGEX });

        // Support for `import rawJs from "a.js?raw"`
        chain.module
          .rule(CHAIN_ID.RULE.JS_RAW)
          .test(SCRIPT_REGEX)
          .type('asset/source')
          .resourceQuery(RAW_QUERY_REGEX);

        const dataUriRule = chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .mimetype({
            or: ['text/javascript', 'application/javascript'],
          });

        applyScriptCondition({
          rule,
          isDev,
          config,
          rsbuildTarget: target,
        });

        // Rspack builtin SWC is not suitable for webpack
        if (api.context.bundlerType === 'webpack') {
          return;
        }

        const swcConfig = getDefaultSwcConfig({
          browserslist,
          cacheRoot,
          config,
        });

        applyTransformImport(swcConfig, config.source.transformImport);
        applySwcDecoratorConfig(swcConfig, config);

        // apply polyfill
        if (isWebTarget(target)) {
          const polyfillMode = config.output.polyfill;

          if (polyfillMode === 'off') {
            swcConfig.env!.mode = undefined;
          } else {
            swcConfig.env!.mode = polyfillMode;

            const coreJsDir = applyCoreJs(swcConfig, polyfillMode);
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
         * https://rspack.rs/api/runtime-api/module-methods#import
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
  } catch {
    return '3';
  }
};

function applyCoreJs(swcConfig: SwcLoaderOptions, polyfillMode: Polyfill) {
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

const reduceTransformImportConfig = (
  options: NormalizedSourceConfig['transformImport'],
): TransformImport[] => {
  if (!options) {
    return [];
  }

  let imports: TransformImport[] = [];
  for (const item of castArray(options)) {
    if (isFunction(item)) {
      imports = item(imports) ?? imports;
    } else {
      imports.push(item);
    }
  }
  return imports;
};

function applyTransformImport(
  swcConfig: SwcLoaderOptions,
  pluginImport?: NormalizedSourceConfig['transformImport'],
) {
  const finalPluginImport = reduceTransformImportConfig(pluginImport);

  if (finalPluginImport?.length) {
    swcConfig.rspackExperiments ??= {};
    swcConfig.rspackExperiments.import ??= [];
    swcConfig.rspackExperiments.import.push(...finalPluginImport);
  }
}

function applySwcDecoratorConfig(
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
      throw new Error(
        `${color.dim('[rsbuild:swc]')} Unknown decorators version: ${color.yellow(
          version,
        )}`,
      );
  }
}
