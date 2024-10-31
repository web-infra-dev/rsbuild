import { join, posix } from 'node:path';
import type { Compiler } from '@rspack/core';
import { LOADER_PATH } from './constants';
import { createPublicContext } from './createContext';
import { removeLeadingSlash } from './helpers';
import type { TransformLoaderOptions } from './loader/transformLoader';
import { logger } from './logger';
import { isPluginMatchEnvironment } from './pluginManager';
import type {
  GetRsbuildConfig,
  InternalContext,
  NormalizedConfig,
  NormalizedEnvironmentConfig,
  PluginManager,
  ProcessAssetsDescriptor,
  ProcessAssetsFn,
  ProcessAssetsHandler,
  ProcessAssetsStage,
  ResolveFn,
  ResolveHandler,
  RsbuildPluginAPI,
  TransformFn,
  TransformHandler,
} from './types';

export function getHTMLPathByEntry(
  entryName: string,
  config: NormalizedEnvironmentConfig,
): string {
  let filename: string;

  if (config.output.filename.html) {
    filename = config.output.filename.html.replace('[name]', entryName);
  } else if (config.html.outputStructure === 'flat') {
    filename = `${entryName}.html`;
  } else {
    filename = `${entryName}/index.html`;
  }

  const prefix = config.output.distPath.html;

  if (prefix.startsWith('/')) {
    logger.warn(
      `Absolute path is not recommended at \`output.distPath.html\`: "${prefix}", please use relative path instead.`,
    );
  }

  return removeLeadingSlash(posix.join(prefix, filename));
}

const mapProcessAssetsStage = (
  compiler: Compiler,
  stage: ProcessAssetsStage,
) => {
  const { Compilation } = compiler.webpack;
  switch (stage) {
    case 'additional':
      return Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL;
    case 'pre-process':
      return Compilation.PROCESS_ASSETS_STAGE_PRE_PROCESS;
    case 'derived':
      return Compilation.PROCESS_ASSETS_STAGE_DERIVED;
    case 'additions':
      return Compilation.PROCESS_ASSETS_STAGE_ADDITIONS;
    case 'none':
      return Compilation.PROCESS_ASSETS_STAGE_NONE;
    case 'optimize':
      return Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE;
    case 'optimize-count':
      return Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_COUNT;
    case 'optimize-compatibility':
      return Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_COMPATIBILITY;
    case 'optimize-size':
      return Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE;
    case 'dev-tooling':
      return Compilation.PROCESS_ASSETS_STAGE_DEV_TOOLING;
    case 'optimize-inline':
      return Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE;
    case 'summarize':
      return Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE;
    case 'optimize-hash':
      return Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_HASH;
    case 'optimize-transfer':
      return Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER;
    case 'analyse':
      return Compilation.PROCESS_ASSETS_STAGE_ANALYSE;
    case 'report':
      return Compilation.PROCESS_ASSETS_STAGE_REPORT;
    default:
      throw new Error(`Invalid process assets stage: ${stage}`);
  }
};

export function initPluginAPI({
  context,
  pluginManager,
}: {
  context: InternalContext;
  pluginManager: PluginManager;
}): (environment?: string) => RsbuildPluginAPI {
  const { hooks } = context;
  const publicContext = createPublicContext(context);

  function getNormalizedConfig(): NormalizedConfig;
  function getNormalizedConfig(options: {
    environment: string;
  }): NormalizedEnvironmentConfig;
  function getNormalizedConfig(options?: { environment: string }) {
    if (context.normalizedConfig) {
      if (options?.environment) {
        const config =
          context.normalizedConfig.environments[options.environment];

        if (!config) {
          throw new Error(
            `Cannot find normalized config by environment: ${options.environment}.`,
          );
        }
        return config;
      }
      return context.normalizedConfig;
    }
    throw new Error(
      'Cannot access normalized config until modifyRsbuildConfig is called.',
    );
  }

  const getRsbuildConfig = ((type = 'current') => {
    switch (type) {
      case 'original':
        return context.originalConfig;
      case 'current':
        return context.config;
      case 'normalized':
        return getNormalizedConfig();
    }
    throw new Error('`getRsbuildConfig` get an invalid type param.');
  }) as GetRsbuildConfig;

  const exposed: Array<{ id: string | symbol; api: any }> = [];

  const expose = (id: string | symbol, api: any) => {
    exposed.push({ id, api });
  };
  const useExposed = (id: string | symbol) => {
    const matched = exposed.find((item) => item.id === id);
    if (matched) {
      return matched.api;
    }
  };

  let transformId = 0;
  const transformer: Record<string, TransformHandler> = {};
  const processAssetsFns: Array<{
    environment?: string;
    descriptor: ProcessAssetsDescriptor;
    handler: ProcessAssetsHandler;
  }> = [];

  const resolveFns: Array<{
    environment?: string;
    handler: ResolveHandler;
  }> = [];

  hooks.modifyBundlerChain.tap((chain, { target, environment }) => {
    const pluginName = 'RsbuildCorePlugin';

    /**
     * Transform Rsbuild plugin hooks to Rspack plugin hooks
     */
    class RsbuildCorePlugin {
      apply(compiler: Compiler): void {
        compiler.__rsbuildTransformer = transformer;

        for (const { handler, environment: pluginEnvironment } of resolveFns) {
          if (
            pluginEnvironment &&
            !isPluginMatchEnvironment(pluginEnvironment, environment.name)
          ) {
            return;
          }

          compiler.hooks.compilation.tap(
            pluginName,
            (compilation, { normalModuleFactory }) => {
              normalModuleFactory.hooks.resolve.tapPromise(
                pluginName,
                async (resolveData) =>
                  handler({
                    compiler,
                    compilation,
                    environment,
                    resolveData,
                  }),
              );
            },
          );
        }

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
          compilation.hooks.childCompiler.tap(pluginName, (childCompiler) => {
            childCompiler.__rsbuildTransformer = transformer;
          });

          const { sources } = compiler.webpack;

          for (const {
            descriptor,
            handler,
            environment: pluginEnvironment,
          } of processAssetsFns) {
            // filter by targets
            if (descriptor.targets && !descriptor.targets.includes(target)) {
              return;
            }

            // filter by environments
            if (
              (descriptor.environments &&
                !descriptor.environments.includes(environment.name)) ||
              // the plugin is registered in a specific environment config
              (pluginEnvironment &&
                !isPluginMatchEnvironment(pluginEnvironment, environment.name))
            ) {
              return;
            }

            compilation.hooks.processAssets.tapPromise(
              {
                name: pluginName,
                stage: mapProcessAssetsStage(compiler, descriptor.stage),
              },
              async (assets) =>
                handler({
                  assets,
                  compiler,
                  compilation,
                  environment,
                  sources,
                }),
            );
          }
        });
      }
    }

    chain.plugin(pluginName).use(RsbuildCorePlugin);
  });

  const getTransformFn: (environment?: string) => TransformFn =
    (environment) => (descriptor, handler) => {
      const id = `rsbuild-transform-${transformId++}`;

      transformer[id] = handler;

      hooks.modifyBundlerChain.tapEnvironment({
        environment,
        handler: (chain, { target, environment }) => {
          // filter by targets
          if (descriptor.targets && !descriptor.targets.includes(target)) {
            return;
          }

          // filter by environments
          if (
            descriptor.environments &&
            !descriptor.environments.includes(environment.name)
          ) {
            return;
          }

          const rule = chain.module.rule(id);

          if (descriptor.test) {
            rule.test(descriptor.test);
          }
          if (descriptor.resourceQuery) {
            rule.resourceQuery(descriptor.resourceQuery);
          }

          const loaderName = descriptor.raw
            ? 'transformRawLoader.cjs'
            : 'transformLoader.cjs';
          const loaderPath = join(LOADER_PATH, loaderName);

          rule
            .use(id)
            .loader(loaderPath)
            .options({
              id,
              getEnvironment: () => environment,
            } satisfies TransformLoaderOptions);
        },
      });
    };

  const setProcessAssets: (environment?: string) => ProcessAssetsFn =
    (environment) => (descriptor, handler) => {
      processAssetsFns.push({ environment, descriptor, handler });
    };

  const setResolve: (environment?: string) => ResolveFn =
    (environment) => (handler) => {
      resolveFns.push({ environment, handler });
    };

  let onExitListened = false;

  const onExit: typeof hooks.onExit.tap = (cb) => {
    if (!onExitListened) {
      process.on('exit', () => {
        hooks.onExit.call();
      });
      onExitListened = true;
    }
    hooks.onExit.tap(cb);
  };

  // Each plugin returns different APIs depending on the registered environment info.
  return (environment?: string) => ({
    context: publicContext,
    expose,
    transform: getTransformFn(environment),
    useExposed,
    processAssets: setProcessAssets(environment),
    resolve: setResolve(environment),
    getRsbuildConfig,
    getNormalizedConfig,
    isPluginExists: pluginManager.isPluginExists,

    // Hooks
    onExit,
    onAfterBuild: hooks.onAfterBuild.tap,
    onBeforeBuild: hooks.onBeforeBuild.tap,
    onCloseDevServer: hooks.onCloseDevServer.tap,
    onDevCompileDone: hooks.onDevCompileDone.tap,
    onAfterCreateCompiler: hooks.onAfterCreateCompiler.tap,
    onAfterStartDevServer: hooks.onAfterStartDevServer.tap,
    onBeforeCreateCompiler: hooks.onBeforeCreateCompiler.tap,
    onBeforeStartDevServer: hooks.onBeforeStartDevServer.tap,
    onAfterStartProdServer: hooks.onAfterStartProdServer.tap,
    onBeforeStartProdServer: hooks.onBeforeStartProdServer.tap,
    modifyRsbuildConfig: hooks.modifyRsbuildConfig.tap,
    modifyHTMLTags: (handler) =>
      hooks.modifyHTMLTags.tapEnvironment({
        environment,
        handler,
      }),
    modifyBundlerChain: (handler) =>
      hooks.modifyBundlerChain.tapEnvironment({
        environment,
        handler,
      }),
    modifyRspackConfig: (handler) =>
      hooks.modifyRspackConfig.tapEnvironment({
        environment,
        handler,
      }),
    modifyWebpackChain: (handler) =>
      hooks.modifyWebpackChain.tapEnvironment({
        environment,
        handler,
      }),
    modifyWebpackConfig: (handler) =>
      hooks.modifyWebpackConfig.tapEnvironment({
        environment,
        handler,
      }),
    modifyEnvironmentConfig: (handler) =>
      hooks.modifyEnvironmentConfig.tapEnvironment({
        environment,
        handler,
      }),
    onAfterEnvironmentCompile: (handler) =>
      hooks.onAfterEnvironmentCompile.tapEnvironment({
        environment,
        handler,
      }),
    onBeforeEnvironmentCompile: (handler) =>
      hooks.onBeforeEnvironmentCompile.tapEnvironment({
        environment,
        handler,
      }),
  });
}
