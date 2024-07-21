import { join } from 'node:path';
import type { Compiler } from '@rspack/core';
import { LOADER_PATH } from './constants';
import { createPublicContext } from './createContext';
import { removeLeadingSlash } from './helpers';
import type { TransformLoaderOptions } from './loader/transformLoader';
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
  RsbuildPluginAPI,
  TransformFn,
  TransformHandler,
} from './types';

export function getHTMLPathByEntry(
  entryName: string,
  config: NormalizedEnvironmentConfig,
): string {
  const filename =
    config.html.outputStructure === 'flat'
      ? `${entryName}.html`
      : `${entryName}/index.html`;

  return removeLeadingSlash(`${config.output.distPath.html}/${filename}`);
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

export function getPluginAPI({
  context,
  pluginManager,
}: {
  context: InternalContext;
  pluginManager: PluginManager;
}): RsbuildPluginAPI {
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
    descriptor: ProcessAssetsDescriptor;
    handler: ProcessAssetsHandler;
  }> = [];

  hooks.modifyBundlerChain.tap((chain, { target, environment }) => {
    const pluginName = 'RsbuildCorePlugin';

    /**
     * Transform Rsbuild plugin hooks to Rspack plugin hooks
     */
    class RsbuildCorePlugin {
      apply(compiler: Compiler): void {
        compiler.__rsbuildTransformer = transformer;

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
          compilation.hooks.childCompiler.tap(pluginName, (childCompiler) => {
            childCompiler.__rsbuildTransformer = transformer;
          });
        });

        compiler.hooks.compilation.tap(pluginName, (compilation) => {
          for (const { descriptor, handler } of processAssetsFns) {
            // filter by targets
            if (descriptor.targets && !descriptor.targets.includes(target)) {
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
                }),
            );
          }
        });
      }
    }

    chain.plugin(pluginName).use(RsbuildCorePlugin);
  });

  const transform: TransformFn = (descriptor, handler) => {
    const id = `rsbuild-transform-${transformId++}`;

    transformer[id] = handler;

    hooks.modifyBundlerChain.tap((chain, { target, environment }) => {
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
    });
  };

  const processAssets: ProcessAssetsFn = (descriptor, handler) => {
    processAssetsFns.push({ descriptor, handler });
  };

  process.on('exit', () => {
    hooks.onExit.call();
  });

  return {
    context: publicContext,
    expose,
    transform,
    useExposed,
    processAssets,
    getRsbuildConfig,
    getNormalizedConfig,
    isPluginExists: pluginManager.isPluginExists,

    // Hooks
    onExit: hooks.onExit.tap,
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
    modifyHTMLTags: hooks.modifyHTMLTags.tap,
    modifyBundlerChain: hooks.modifyBundlerChain.tap,
    modifyRspackConfig: hooks.modifyRspackConfig.tap,
    modifyWebpackChain: hooks.modifyWebpackChain.tap,
    modifyWebpackConfig: hooks.modifyWebpackConfig.tap,
    modifyRsbuildConfig: hooks.modifyRsbuildConfig.tap,
    modifyEnvironmentConfig: hooks.modifyEnvironmentConfig.tap,
  };
}
