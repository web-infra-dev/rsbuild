import { existsSync } from 'node:fs';
import { isPromise } from 'node:util/types';
import { createContext } from './createContext';
import {
  color,
  getNodeEnv,
  isEmptyDir,
  isFunction,
  pick,
  setNodeEnv,
} from './helpers';
import { initPluginAPI } from './initPlugins';
import { logger } from './logger';
import { createPluginManager } from './pluginManager';
import { pluginAppIcon } from './plugins/appIcon';
import { pluginAsset } from './plugins/asset';
import { pluginBasic } from './plugins/basic';
import { pluginBundleAnalyzer } from './plugins/bundleAnalyzer';
import { pluginCache } from './plugins/cache';
import { pluginCleanOutput } from './plugins/cleanOutput';
import { pluginCss } from './plugins/css';
import { pluginDefine } from './plugins/define';
import { pluginEntry } from './plugins/entry';
import { pluginExternals } from './plugins/externals';
import { pluginFileSize } from './plugins/fileSize';
import { pluginHtml } from './plugins/html';
import { pluginInlineChunk } from './plugins/inlineChunk';
import { pluginLazyCompilation } from './plugins/lazyCompilation';
import { pluginManifest } from './plugins/manifest';
import { pluginMinimize } from './plugins/minimize';
import { pluginModuleFederation } from './plugins/moduleFederation';
import { pluginMoment } from './plugins/moment';
import { pluginNodeAddons } from './plugins/nodeAddons';
import { pluginNonce } from './plugins/nonce';
import { pluginOutput } from './plugins/output';
import { pluginPerformance } from './plugins/performance';
import { pluginProgress } from './plugins/progress';
import { pluginResolve } from './plugins/resolve';
import { pluginResourceHints } from './plugins/resourceHints';
import { pluginRsdoctor } from './plugins/rsdoctor';
import { pluginRspackProfile } from './plugins/rspackProfile';
import { pluginServer } from './plugins/server';
import { pluginSplitChunks } from './plugins/splitChunks';
import { pluginSri } from './plugins/sri';
import { pluginSwc } from './plugins/swc';
import { pluginTarget } from './plugins/target';
import { pluginWasm } from './plugins/wasm';
import * as providerHelpers from './provider/helpers';
import { initRsbuildConfig } from './provider/initConfigs';
import { rspackProvider } from './provider/provider';
import { startProdServer } from './server/prodServer';
import type {
  Build,
  CreateCompiler,
  CreateDevServer,
  CreateRsbuildOptions,
  Falsy,
  InternalContext,
  PluginManager,
  PreviewOptions,
  ResolvedCreateRsbuildOptions,
  RsbuildInstance,
  RsbuildPlugin,
  RsbuildPlugins,
  RsbuildProvider,
  StartDevServer,
} from './types';

async function applyDefaultPlugins(
  pluginManager: PluginManager,
  context: InternalContext,
) {
  pluginManager.addPlugins([
    pluginBasic(),
    pluginEntry(),
    pluginCache(),
    pluginTarget(),
    pluginOutput(),
    pluginResolve(),
    pluginFileSize(),
    // cleanOutput plugin should before the html plugin
    pluginCleanOutput(),
    pluginAsset(),
    pluginHtml((environment: string) => async (...args) => {
      const result = await context.hooks.modifyHTMLTags.callChain({
        environment,
        args,
      });
      return result[0];
    }),
    pluginAppIcon(),
    pluginWasm(),
    pluginMoment(),
    pluginNodeAddons(),
    pluginDefine(),
    pluginCss(),
    pluginMinimize(),
    pluginProgress(),
    pluginSwc(),
    pluginExternals(),
    pluginSplitChunks(),
    pluginInlineChunk(),
    pluginRsdoctor(),
    pluginResourceHints(),
    pluginPerformance(),
    pluginBundleAnalyzer(),
    pluginServer(),
    pluginManifest(),
    pluginModuleFederation(),
    pluginRspackProfile(),
    pluginLazyCompilation(),
    pluginSri(),
    pluginNonce(),
  ]);
}

/**
 * Create an Rsbuild instance.
 */
export async function createRsbuild(
  options: CreateRsbuildOptions = {},
): Promise<RsbuildInstance> {
  const rsbuildConfig = isFunction(options.rsbuildConfig)
    ? await options.rsbuildConfig()
    : options.rsbuildConfig || {};

  const rsbuildOptions: ResolvedCreateRsbuildOptions = {
    cwd: process.cwd(),
    rsbuildConfig,
    ...options,
  };

  const pluginManager = createPluginManager();

  const context = await createContext(
    rsbuildOptions,
    rsbuildConfig,
    rsbuildConfig.provider ? 'webpack' : 'rspack',
  );

  const getPluginAPI = initPluginAPI({ context, pluginManager });
  context.getPluginAPI = getPluginAPI;
  const globalPluginAPI = getPluginAPI();

  logger.debug('add default plugins');
  await applyDefaultPlugins(pluginManager, context);
  logger.debug('add default plugins done');

  const provider =
    (rsbuildConfig.provider as RsbuildProvider) || rspackProvider;

  const providerInstance = await provider({
    context,
    pluginManager,
    rsbuildOptions,
    helpers: providerHelpers,
  });

  const preview = async (options: PreviewOptions = {}) => {
    context.command = 'preview';

    if (!getNodeEnv()) {
      setNodeEnv('production');
    }

    const config = await initRsbuildConfig({ context, pluginManager });
    const { distPath } = context;
    const { checkDistDir = true } = options;

    if (checkDistDir) {
      if (!existsSync(distPath)) {
        throw new Error(
          `[rsbuild:preview] The output directory ${color.yellow(
            distPath,
          )} does not exist, please build the project before previewing.`,
        );
      }

      if (isEmptyDir(distPath)) {
        throw new Error(
          `[rsbuild:preview] The output directory ${color.yellow(
            distPath,
          )} is empty, please build the project before previewing.`,
        );
      }
    }

    return startProdServer(context, config, options);
  };

  const build: Build = async (...args) => {
    context.command = 'build';

    if (!getNodeEnv()) {
      setNodeEnv('production');
    }

    const buildInstance = await providerInstance.build(...args);
    return {
      ...buildInstance,
      close: async () => {
        await context.hooks.onCloseBuild.callBatch();
        await buildInstance.close();
      },
    };
  };

  const startDevServer: StartDevServer = (...args) => {
    context.command = 'dev';

    if (!getNodeEnv()) {
      setNodeEnv('development');
    }

    return providerInstance.startDevServer(...args);
  };

  const createDevServer: CreateDevServer = (...args) => {
    context.command = 'dev';

    if (!getNodeEnv()) {
      setNodeEnv('development');
    }

    return providerInstance.createDevServer(...args);
  };

  const createCompiler: CreateCompiler = (...args) => {
    if (!context.command) {
      context.command = getNodeEnv() === 'development' ? 'dev' : 'build';
    }
    return providerInstance.createCompiler(...args);
  };

  const rsbuild = {
    build,
    preview,
    startDevServer,
    createCompiler,
    createDevServer,
    ...pick(pluginManager, [
      'addPlugins',
      'getPlugins',
      'removePlugins',
      'isPluginExists',
    ]),
    ...pick(globalPluginAPI, [
      'context',
      'onCloseBuild',
      'onBeforeBuild',
      'onBeforeCreateCompiler',
      'onBeforeStartDevServer',
      'onBeforeStartProdServer',
      'onAfterBuild',
      'onAfterCreateCompiler',
      'onAfterStartDevServer',
      'onAfterStartProdServer',
      'onCloseDevServer',
      'onDevCompileDone',
      'onExit',
      'getRsbuildConfig',
      'getNormalizedConfig',
    ]),
    ...pick(providerInstance, ['initConfigs', 'inspectConfig']),
  };

  const getFlattenedPlugins = async (pluginOptions: RsbuildPlugins) => {
    let plugins = pluginOptions;
    do {
      plugins = (await Promise.all(plugins)).flat(
        Number.POSITIVE_INFINITY as 1,
      );
    } while (plugins.some((v) => isPromise(v)));

    return plugins as Array<RsbuildPlugin | Falsy>;
  };

  if (rsbuildConfig.plugins) {
    const plugins = await getFlattenedPlugins(rsbuildConfig.plugins);
    rsbuild.addPlugins(plugins);
  }

  // Register environment plugin
  if (rsbuildConfig.environments) {
    await Promise.all(
      Object.entries(rsbuildConfig.environments).map(async ([name, config]) => {
        if (!config.plugins) {
          return;
        }

        // If the current environment is not specified, skip it
        if (
          context.specifiedEnvironments &&
          !context.specifiedEnvironments.includes(name)
        ) {
          return;
        }

        const plugins = await getFlattenedPlugins(config.plugins);
        rsbuild.addPlugins(plugins, {
          environment: name,
        });
      }),
    );
  }

  return rsbuild;
}
