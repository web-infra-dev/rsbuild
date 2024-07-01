import type { CreateCompiler } from '@rsbuild/shared';
import type { RsbuildProvider } from '../types';
import { initConfigs, initRsbuildConfig } from './initConfigs';

export const rspackProvider: RsbuildProvider = async ({
  context,
  pluginManager,
  rsbuildOptions,
}) => {
  const createCompiler = (async () => {
    const { createCompiler } = await import('./createCompiler');
    const { rspackConfigs } = await initConfigs({
      context,
      pluginManager,
      rsbuildOptions,
    });

    return createCompiler({
      context,
      rspackConfigs,
    });
  }) as CreateCompiler;

  return {
    bundler: 'rspack',

    createCompiler,

    async createDevServer(options) {
      const { createDevServer } = await import('../server/devServer');
      const { createDevMiddleware } = await import('./createCompiler');
      const config = await initRsbuildConfig({ context, pluginManager });
      return createDevServer(
        { context, pluginManager, rsbuildOptions },
        createDevMiddleware,
        config,
        options,
      );
    },

    async startDevServer(options) {
      const { createDevServer } = await import('../server/devServer');
      const { createDevMiddleware } = await import('./createCompiler');
      const config = await initRsbuildConfig({ context, pluginManager });

      const server = await createDevServer(
        { context, pluginManager, rsbuildOptions },
        createDevMiddleware,
        config,
        options,
      );

      return server.listen();
    },

    async build(options) {
      const { build } = await import('./build');
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
      const { inspectConfig } = await import('./inspectConfig');
      return inspectConfig({
        context,
        pluginManager,
        rsbuildOptions,
        inspectOptions,
      });
    },
  };
};
