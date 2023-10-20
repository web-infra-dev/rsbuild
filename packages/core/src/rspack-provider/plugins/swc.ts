import * as path from 'path';

import { getCoreJsVersion } from '@rsbuild/shared';
import {
  RsbuildTarget,
  getBrowserslistWithDefault,
  logger,
  setConfig,
  isWebTarget,
  addCoreJsEntry,
} from '@rsbuild/shared';
import type {
  RsbuildPlugin,
  RsbuildPluginAPI,
  NormalizedConfig,
  RspackConfig,
} from '../types';
import { Builtins } from '@rspack/core';

/**
 * Provide some swc configs of rspack
 */
export const pluginSwc = (): RsbuildPlugin => ({
  name: 'plugin-swc',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isServer, isServiceWorker }) => {
      const config = api.getNormalizedConfig();

      addCoreJsEntry({
        chain,
        config,
        isServer,
        isServiceWorker,
      });
    });

    api.modifyRspackConfig(async (rspackConfig, { target }) => {
      const rsbuildConfig = api.getNormalizedConfig();

      // Apply decorator and presetEnv
      await applyDefaultConfig(rspackConfig, rsbuildConfig, api, target);
    });
  },
});

async function applyDefaultConfig(
  rspackConfig: RspackConfig,
  rsbuildConfig: NormalizedConfig,
  api: RsbuildPluginAPI,
  target: RsbuildTarget,
) {
  const legacy = !rsbuildConfig.output.enableLatestDecorators;
  /**
   * Swc only enable latestDecorator for JS module, not TS module.
   */
  setConfig(rspackConfig, 'builtins.decorator', {
    legacy,
    emitMetadata: legacy,
  });

  rspackConfig.builtins ??= {};
  rspackConfig.builtins.presetEnv ??= {};

  await setBrowserslist(
    api.context.rootPath,
    rsbuildConfig,
    target,
    rspackConfig,
  );

  /**
   * Enable preset-env polyfill: set rspackConfig.target === 'browserslist'
   */
  if (isWebTarget(target)) {
    const polyfillMode = rsbuildConfig.output.polyfill;

    // TODO: remove this when Rspack support `usage` mode
    if (polyfillMode === 'usage') {
      logger.warn(
        'Cannot use `usage` mode polyfill for now, Rspack will support it soon',
      );
      rspackConfig.builtins.presetEnv.mode = undefined;
      return;
    }

    if (polyfillMode === 'off' || polyfillMode === 'ua') {
      rspackConfig.builtins.presetEnv.mode = undefined;
    } else {
      rspackConfig.builtins.presetEnv.mode = polyfillMode;
      /* Apply core-js version and path alias */
      applyCoreJs(rspackConfig);
    }
  }

  applyTransformImport(rspackConfig, rsbuildConfig.source.transformImport);
}

async function setBrowserslist(
  rootPath: string,
  rsbuildConfig: NormalizedConfig,
  target: RsbuildTarget,
  rspackConfig: RspackConfig,
) {
  const browserslist = await getBrowserslistWithDefault(
    rootPath,
    rsbuildConfig,
    target,
  );

  if (browserslist) {
    rspackConfig.builtins!.presetEnv!.targets = browserslist;
  }
}

function applyCoreJs(rspackConfig: RspackConfig) {
  const coreJsPath = require.resolve('core-js/package.json');
  const version = getCoreJsVersion(coreJsPath);

  rspackConfig.builtins!.presetEnv!.coreJs = version;

  rspackConfig.resolve ??= {};
  rspackConfig.resolve.alias ??= {};
  rspackConfig.resolve.alias['core-js'] = path.dirname(coreJsPath);
}

async function applyTransformImport(
  rspackConfig: RspackConfig,
  pluginImport?: false | Builtins['pluginImport'],
) {
  if (pluginImport !== false && pluginImport) {
    ensureNoJsFunction(pluginImport);
    rspackConfig.builtins ??= {};
    rspackConfig.builtins.pluginImport ??= [];
    rspackConfig.builtins.pluginImport.push(...pluginImport);
  }
}

function ensureNoJsFunction(pluginImport: Array<Record<string, any>>) {
  for (const item of pluginImport) {
    for (const key in item) {
      if (typeof item[key] === 'function') {
        throw new TypeError(
          '`builtins.pluginImport` can not contain Function configuration',
        );
      }
    }
  }
}
