import { existsSync } from 'node:fs';
import { isPromise } from 'node:util/types';
import { createContext } from './createContext';
import {
  castArray,
  color,
  getNodeEnv,
  isEmptyDir,
  isFunction,
  pick,
  setNodeEnv,
} from './helpers';
import { initPluginAPI } from './initPlugins';
import { type LoadEnvResult, loadEnv } from './loadEnv';
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
import { pluginEsm } from './plugins/esm';
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
  InspectConfig,
  InternalContext,
  PluginManager,
  PreviewOptions,
  ResolvedCreateRsbuildOptions,
  RsbuildConfig,
  RsbuildInstance,
  RsbuildPlugin,
  RsbuildPlugins,
  RsbuildProvider,
  StartDevServer,
} from './types';

function applyDefaultPlugins(
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
    pluginHtml(context),
    pluginAppIcon(),
    pluginWasm(),
    pluginMoment(),
    pluginNodeAddons(),
    pluginDefine(),
    pluginCss(),
    pluginMinimize(),
    pluginProgress(),
    pluginSwc(),
    pluginEsm(),
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

function applyEnvsToConfig(config: RsbuildConfig, envs: LoadEnvResult | null) {
  if (envs === null) {
    return;
  }

  // define the public environment variables
  config.source ||= {};
  config.source.define = {
    ...envs.publicVars,
    ...config.source.define,
  };

  if (envs.filePaths.length === 0) {
    return;
  }

  // watch the env files
  config.dev ||= {};
  config.dev.watchFiles = [
    ...(config.dev.watchFiles ? castArray(config.dev.watchFiles) : []),
    {
      paths: envs.filePaths,
      type: 'reload-server',
    },
  ];

  // add env files to build dependencies, so that the build cache
  // can be invalidated when the env files are changed.
  if (config.performance?.buildCache) {
    const { buildCache } = config.performance;
    if (buildCache === true) {
      config.performance.buildCache = {
        buildDependencies: envs.filePaths,
      };
    } else {
      buildCache.buildDependencies ||= [];
      buildCache.buildDependencies.push(...envs.filePaths);
    }
  }
}

/**
 * Create an Rsbuild instance.
 */
export async function createRsbuild(
  options: CreateRsbuildOptions = {},
): Promise<RsbuildInstance> {
  const envs = options.loadEnv
    ? loadEnv({
        cwd: options.cwd,
        ...(typeof options.loadEnv === 'boolean' ? {} : options.loadEnv),
      })
    : null;

  const config = isFunction(options.rsbuildConfig)
    ? await options.rsbuildConfig()
    : options.rsbuildConfig || {};

  if (config.logLevel) {
    logger.level = config.logLevel;
  }

  applyEnvsToConfig(config, envs);

  const resolvedOptions: ResolvedCreateRsbuildOptions = {
    cwd: process.cwd(),
    callerName: 'rsbuild',
    ...options,
    rsbuildConfig: config,
  };

  const pluginManager = createPluginManager();

  const context = await createContext(resolvedOptions, config);

  const getPluginAPI = initPluginAPI({ context, pluginManager });
  context.getPluginAPI = getPluginAPI;
  const globalPluginAPI = getPluginAPI();

  logger.debug('registering default plugins');
  applyDefaultPlugins(pluginManager, context);
  logger.debug('default plugins registered');

  const provider = (config.provider as RsbuildProvider) || rspackProvider;

  const providerInstance = await provider({
    context,
    pluginManager,
    rsbuildOptions: resolvedOptions,
    helpers: providerHelpers,
  });

  const preview = async (options: PreviewOptions = {}) => {
    context.action = 'preview';

    if (!getNodeEnv()) {
      setNodeEnv('production');
    }

    const config = await initRsbuildConfig({ context, pluginManager });
    const { distPath } = context;
    const { checkDistDir = true } = options;

    if (checkDistDir) {
      if (!existsSync(distPath)) {
        throw new Error(
          `${color.dim('[rsbuild:preview]')} The output directory ${color.yellow(
            distPath,
          )} does not exist, please build the project before previewing.`,
        );
      }

      if (isEmptyDir(distPath)) {
        throw new Error(
          `${color.dim('[rsbuild:preview]')} The output directory ${color.yellow(
            distPath,
          )} is empty, please build the project before previewing.`,
        );
      }
    }

    return startProdServer(context, config, options);
  };

  const build: Build = async (...args) => {
    context.action = 'build';

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
    context.action = 'dev';

    if (!getNodeEnv()) {
      setNodeEnv('development');
    }

    return providerInstance.startDevServer(...args);
  };

  const createDevServer: CreateDevServer = (...args) => {
    context.action = 'dev';

    if (!getNodeEnv()) {
      setNodeEnv('development');
    }

    return providerInstance.createDevServer(...args);
  };

  const initAction = () => {
    if (!context.action) {
      context.action = config.mode === 'development' ? 'dev' : 'build';
    }
  };

  const createCompiler: CreateCompiler = (...args) => {
    initAction();
    return providerInstance.createCompiler(...args);
  };

  const inspectConfig: InspectConfig = async (...args) => {
    initAction();
    return providerInstance.inspectConfig(...args);
  };

  const rsbuild: RsbuildInstance = {
    build,
    preview,
    startDevServer,
    createCompiler,
    createDevServer,
    inspectConfig,
    ...pick(pluginManager, [
      'addPlugins',
      'getPlugins',
      'removePlugins',
      'isPluginExists',
    ]),
    ...pick(globalPluginAPI, [
      'context',
      'expose',
      'getRsbuildConfig',
      'getNormalizedConfig',
      'modifyEnvironmentConfig',
      'modifyRsbuildConfig',
      'onAfterBuild',
      'onAfterCreateCompiler',
      'onAfterDevCompile',
      'onAfterStartDevServer',
      'onAfterStartProdServer',
      'onBeforeBuild',
      'onBeforeCreateCompiler',
      'onBeforeDevCompile',
      'onBeforeStartDevServer',
      'onBeforeStartProdServer',
      'onCloseBuild',
      'onCloseDevServer',
      'onDevCompileDone',
      'onExit',
    ]),
    ...pick(providerInstance, ['initConfigs']),
  };

  if (envs) {
    rsbuild.onCloseBuild(envs.cleanup);
    rsbuild.onCloseDevServer(envs.cleanup);
  }

  const getFlattenedPlugins = async (pluginOptions: RsbuildPlugins) => {
    let plugins = pluginOptions;
    do {
      plugins = (await Promise.all(plugins)).flat(
        Number.POSITIVE_INFINITY as 1,
      );
    } while (plugins.some((v) => isPromise(v)));

    return plugins as (RsbuildPlugin | Falsy)[];
  };

  if (config.plugins) {
    const plugins = await getFlattenedPlugins(config.plugins);
    rsbuild.addPlugins(plugins);
  }

  // Register environment plugin
  if (config.environments) {
    await Promise.all(
      Object.entries(config.environments).map(
        async ([name, environmentConfig]) => {
          if (!environmentConfig.plugins) {
            return;
          }

          // If the current environment is not specified, skip it
          if (
            context.specifiedEnvironments &&
            !context.specifiedEnvironments.includes(name)
          ) {
            return;
          }

          const plugins = await getFlattenedPlugins(environmentConfig.plugins);
          rsbuild.addPlugins(plugins, {
            environment: name,
          });
        },
      ),
    );
  }

  return rsbuild;
}
