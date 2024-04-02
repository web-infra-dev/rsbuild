import { join } from 'node:path';
import {
  getDistPath,
  onExitProcess,
  removeLeadingSlash,
  type TransformFn,
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

const TRANSFORM_PLUGIN_NAME = 'RsbuildTransformPlugin';

function getTransformPlugin(transformer: Record<string, TransformHandler>) {
  return class RsbuildTransformPlugin {
    apply(compiler: Compiler) {
      compiler.__rsbuildTransformer = transformer;

      compiler.hooks.thisCompilation.tap(
        TRANSFORM_PLUGIN_NAME,
        (compilation) => {
          compilation.hooks.childCompiler.tap(
            TRANSFORM_PLUGIN_NAME,
            (childCompiler) => {
              childCompiler.__rsbuildTransformer = transformer;
            },
          );
        },
      );
    }
  };
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

  const transform: TransformFn = (descriptor) => {
    const id = `rsbuild-plugin-transform-${transformId}`;

    transformer[id] = descriptor.handler;

    hooks.modifyBundlerChain.tap((chain) => {
      const rule = chain.module.rule(id);
      if (descriptor.test) {
        rule.test(descriptor.test);
      }
      rule
        .use(id)
        .loader(join(__dirname, '../rspack/transformLoader'))
        .options({ transformId: id });

      if (!chain.plugins.get(TRANSFORM_PLUGIN_NAME)) {
        chain
          .plugin(TRANSFORM_PLUGIN_NAME)
          .use(getTransformPlugin(transformer));
      }
    });

    transformId++;
  };

  onExitProcess(() => {
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
    modifyBundlerChain: hooks.modifyBundlerChain.tap,
    modifyRspackConfig: hooks.modifyRspackConfig.tap,
    modifyWebpackChain: hooks.modifyWebpackChain.tap,
    modifyWebpackConfig: hooks.modifyWebpackConfig.tap,
    modifyRsbuildConfig: hooks.modifyRsbuildConfig.tap,
    onAfterCreateCompiler: hooks.onAfterCreateCompiler.tap,
    onAfterStartDevServer: hooks.onAfterStartDevServer.tap,
    onBeforeCreateCompiler: hooks.onBeforeCreateCompiler.tap,
    onBeforeStartDevServer: hooks.onBeforeStartDevServer.tap,
    onAfterStartProdServer: hooks.onAfterStartProdServer.tap,
    onBeforeStartProdServer: hooks.onBeforeStartProdServer.tap,
  };
}
