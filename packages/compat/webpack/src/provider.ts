import type { CreateCompiler, RsbuildProvider } from '@rsbuild/core';
import { initConfigs } from './initConfigs';
import { createDevServer, initRsbuildConfig } from './shared';

export const webpackProvider: RsbuildProvider<'webpack'> = async ({
  context,
  pluginManager,
  rsbuildOptions,
  setCssExtractPlugin,
}) => {
  const { default: cssExtractPlugin } = await import('mini-css-extract-plugin');
  setCssExtractPlugin(cssExtractPlugin);

  const createCompiler = (async () => {
    const { createCompiler } = await import('./createCompiler');
    const result = await createCompiler({
      context,
      pluginManager,
      rsbuildOptions,
    });
    return result.compiler;
  }) as CreateCompiler;

  const { pluginAdaptor } = await import('./plugin');
  pluginManager.addPlugins([pluginAdaptor()]);

  return {
    bundler: 'webpack',

    createCompiler,

    async initConfigs() {
      const { webpackConfigs } = await initConfigs({
        context,
        pluginManager,
        rsbuildOptions,
      });
      return webpackConfigs;
    },

    async createDevServer(options) {
      const config = await initRsbuildConfig({ context, pluginManager });
      return createDevServer(
        { context, pluginManager, rsbuildOptions },
        createCompiler,
        config,
        options,
      );
    },

    async startDevServer(options) {
      const config = await initRsbuildConfig({
        context,
        pluginManager,
      });
      const server = await createDevServer(
        {
          context,
          pluginManager,
          rsbuildOptions,
        },
        createCompiler,
        config,
        options,
      );

      return server.listen();
    },

    async build(options) {
      const { build } = await import('./build');
      return build({ context, pluginManager, rsbuildOptions }, options);
    },

    async inspectConfig(inspectOptions) {
      const { inspectConfig } = await import('./inspectConfig');
      return await inspectConfig({
        context,
        pluginManager,
        rsbuildOptions,
        inspectOptions,
      });
    },
  };
};
