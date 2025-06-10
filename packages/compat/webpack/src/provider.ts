import type { CreateCompiler, RsbuildProvider } from '@rsbuild/core';
import { build } from './build.js';
import { createCompiler as baseCreateCompiler } from './createCompiler.js';
import { initConfigs } from './initConfigs.js';
import { pluginAdaptor } from './plugin.js';

export const webpackProvider: RsbuildProvider<'webpack'> = async ({
  context,
  pluginManager,
  rsbuildOptions,
  helpers,
}) => {
  const { default: cssExtractPlugin } = await import('mini-css-extract-plugin');
  helpers.setCssExtractPlugin(cssExtractPlugin);

  if (helpers.setHTMLPlugin) {
    const { default: htmlPlugin } = await import('html-webpack-plugin');
    helpers.setHTMLPlugin(
      htmlPlugin as unknown as Parameters<typeof helpers.setHTMLPlugin>[0],
    );
  }

  const createCompiler = (async () => {
    const result = await baseCreateCompiler({
      context,
      pluginManager,
      rsbuildOptions,
      helpers,
    });
    return result.compiler;
  }) as CreateCompiler;

  pluginManager.addPlugins([pluginAdaptor(helpers)]);

  return {
    bundler: 'webpack',

    createCompiler,

    async initConfigs() {
      const { webpackConfigs } = await initConfigs({
        context,
        pluginManager,
        rsbuildOptions,
        helpers,
      });
      return webpackConfigs;
    },

    async createDevServer(options) {
      const config = await helpers.initRsbuildConfig({
        context,
        pluginManager,
      });
      return helpers.createDevServer(
        { context, pluginManager, rsbuildOptions },
        createCompiler,
        config,
        options,
      );
    },

    async startDevServer(options) {
      const config = await helpers.initRsbuildConfig({
        context,
        pluginManager,
      });
      const server = await helpers.createDevServer(
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
      return build(
        { context, pluginManager, rsbuildOptions, helpers },
        options,
      );
    },

    async inspectConfig(inspectOptions) {
      const bundlerConfigs = (
        await initConfigs({
          context,
          pluginManager,
          rsbuildOptions,
          helpers,
        })
      ).webpackConfigs;

      return await helpers.inspectConfig<'webpack'>({
        context,
        pluginManager,
        bundler: 'webpack',
        bundlerConfigs,
        rsbuildOptions,
        inspectOptions,
      });
    },
  };
};
