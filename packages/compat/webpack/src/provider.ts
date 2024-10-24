import type { CreateCompiler, RsbuildProvider } from '@rsbuild/core';
import { build } from './build.js';
import { createCompiler as baseCreateCompiler } from './createCompiler.js';
import { initConfigs } from './initConfigs.js';
import { inspectConfig } from './inspectConfig.js';
import { pluginAdaptor } from './plugin.js';
import { createDevServer, initRsbuildConfig } from './shared.js';

export const webpackProvider: RsbuildProvider<'webpack'> = async ({
  context,
  pluginManager,
  rsbuildOptions,
  setCssExtractPlugin,
}) => {
  const { default: cssExtractPlugin } = await import('mini-css-extract-plugin');
  setCssExtractPlugin(cssExtractPlugin);

  const createCompiler = (async () => {
    const result = await baseCreateCompiler({
      context,
      pluginManager,
      rsbuildOptions,
    });
    return result.compiler;
  }) as CreateCompiler;

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
      return build({ context, pluginManager, rsbuildOptions }, options);
    },

    async inspectConfig(inspectOptions) {
      return await inspectConfig({
        context,
        pluginManager,
        rsbuildOptions,
        inspectOptions,
      });
    },
  };
};
