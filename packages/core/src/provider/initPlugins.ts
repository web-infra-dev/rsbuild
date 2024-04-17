import { join } from 'node:path';
import {
  getDistPath,
  removeLeadingSlash,
  type TransformFn,
  type BundlerChain,
  type PluginManager,
  type RsbuildPluginAPI,
  type GetRsbuildConfig,
  type TransformHandler,
} from '@rsbuild/shared';
import { createPublicContext } from './createContext';
import type { InternalContext, NormalizedConfig } from '../types';
import type { Compiler } from '@rspack/core';

export function getHTMLPathByEntry(
  entryName: string,
  config: NormalizedConfig,
) {
  const htmlPath = getDistPath(config, 'html');
  const filename =
    config.html.outputStructure === 'flat'
      ? `${entryName}.html`
      : `${entryName}/index.html`;

  return removeLeadingSlash(`${htmlPath}/${filename}`);
}

function applyTransformPlugin(
  chain: BundlerChain,
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

  const getNormalizedConfig = () => {
    if (context.normalizedConfig) {
      return context.normalizedConfig;
    }
    throw new Error(
      'Cannot access normalized config until modifyRsbuildConfig is called.',
    );
  };

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

    hooks.modifyBundlerChain.tap((chain) => {
      const rule = chain.module.rule(id);

      if (descriptor.test) {
        rule.test(descriptor.test);
      }
      if (descriptor.resourceQuery) {
        rule.resourceQuery(descriptor.resourceQuery);
      }

      rule
        .use(id)
        .loader(join(__dirname, '../rspack/transformLoader'))
        .options({ id });

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
