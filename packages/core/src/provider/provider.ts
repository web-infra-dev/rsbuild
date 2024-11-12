import { createDevServer } from '../server/devServer';
import type { CreateCompiler, RsbuildProvider } from '../types';
import { build } from './build';
import { createCompiler as baseCreateCompiler } from './createCompiler';
import { initConfigs, initRsbuildConfig } from './initConfigs';
import { inspectConfig } from './inspectConfig';

export const rspackProvider: RsbuildProvider = async ({
  context,
  pluginManager,
  rsbuildOptions,
}) => {
  const createCompiler = (async () => {
    const result = await baseCreateCompiler({
      context,
      pluginManager,
      rsbuildOptions,
    });
    return result.compiler;
  }) as CreateCompiler;

  return {
    bundler: 'rspack',

    createCompiler,

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
      const config = await initRsbuildConfig({ context, pluginManager });
      const server = await createDevServer(
        { context, pluginManager, rsbuildOptions },
        createCompiler,
        config,
        options,
      );

      return server.listen();
    },

    async build(options) {
      return build({ context, pluginManager, rsbuildOptions }, options);
    },

    async initConfigs() {
      const { rspackConfigs } = await initConfigs({
        context,
        pluginManager,
        rsbuildOptions,
      });
      return rspackConfigs;
    },

    async inspectConfig(inspectOptions) {
      return inspectConfig({
        context,
        pluginManager,
        rsbuildOptions,
        inspectOptions,
      });
    },
  };
};
