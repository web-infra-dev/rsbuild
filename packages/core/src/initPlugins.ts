import { join } from 'node:path';
import type {
  GetRsbuildConfig,
  NormalizedEnvironmentConfig,
  PluginManager,
  RsbuildPluginAPI,
  RspackChain,
  TransformFn,
  TransformHandler,
} from '@rsbuild/shared';
import type { Compiler } from '@rspack/core';
import { LOADER_PATH } from './constants';
import { createPublicContext } from './createContext';
import { removeLeadingSlash } from './helpers';
import type { InternalContext, NormalizedConfig } from './types';

export function getHTMLPathByEntry(
  entryName: string,
  config: NormalizedConfig,
) {
  const filename =
    config.html.outputStructure === 'flat'
      ? `${entryName}.html`
      : `${entryName}/index.html`;

  return removeLeadingSlash(`${config.output.distPath.html}/${filename}`);
}

function applyTransformPlugin(
  chain: RspackChain,
  transformer: Record<string, TransformHandler>,
) {
  const name = 'RsbuildTransformPlugin';

  if (chain.plugins.get(name)) {
    return;
  }

  class RsbuildTransformPlugin {
    apply(compiler: Compiler) {
      compiler.__rsbuildTransformer = transformer;

      compiler.hooks.thisCompilation.tap(name, (compilation) => {
        compilation.hooks.childCompiler.tap(name, (childCompiler) => {
          childCompiler.__rsbuildTransformer = transformer;
        });
      });
    }
  }

  chain.plugin(name).use(RsbuildTransformPlugin);
}

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

  const getHTMLPaths = () => {
    return Object.keys(context.entry).reduce<Record<string, string>>(
      (prev, key) => {
        prev[key] = getHTMLPathByEntry(key, getNormalizedConfig());
        return prev;
      },
      {},
    );
  };

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

  const transform: TransformFn = (descriptor, handler) => {
    const id = `rsbuild-transform-${transformId++}`;

    transformer[id] = handler;

    hooks.modifyBundlerChain.tap((chain, { target }) => {
      if (descriptor.targets && !descriptor.targets.includes(target)) {
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

      rule.use(id).loader(loaderPath).options({ id });

      applyTransformPlugin(chain, transformer);
    });
  };

  process.on('exit', () => {
    hooks.onExit.call();
  });

  return {
    context: publicContext,
    expose,
    transform,
    useExposed,
    getHTMLPaths,
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
  };
}
