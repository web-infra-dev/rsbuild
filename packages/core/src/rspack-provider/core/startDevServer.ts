import {
  debug,
  startDevServer as baseStartDevServer,
  StartDevServerOptions,
  getDevServerOptions,
  type RspackCompiler,
  type RspackMultiCompiler,
} from '@rsbuild/shared';
import { createCompiler } from './createCompiler';
import { getDevMiddleware } from './devMiddleware';
import { initConfigs, type InitConfigsOptions } from './initConfigs';

type ServerOptions = Exclude<StartDevServerOptions['serverOptions'], undefined>;

export async function createDevServer(
  options: InitConfigsOptions,
  port: number,
  serverOptions: ServerOptions,
  customCompiler?: RspackCompiler | RspackMultiCompiler,
) {
  const { Server } = await import('@modern-js/server');

  let compiler: RspackCompiler | RspackMultiCompiler;
  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const { rspackConfigs } = await initConfigs(options);
    compiler = await createCompiler({
      context: options.context,
      rspackConfigs,
    });
  }

  debug('create dev server');

  const rsbuildConfig = options.context.config;
  const { config, devConfig } = await getDevServerOptions({
    rsbuildConfig,
    serverOptions,
    port,
  });

  const server = new Server({
    pwd: options.context.rootPath,
    devMiddleware: getDevMiddleware(compiler),
    ...serverOptions,
    dev: devConfig,
    config,
  });

  debug('create dev server done');

  return server;
}

export async function startDevServer(
  options: InitConfigsOptions,
  startDevServerOptions: StartDevServerOptions = {},
) {
  return baseStartDevServer(
    options,
    (
      options: InitConfigsOptions,
      port: number,
      serverOptions: ServerOptions,
      compiler: StartDevServerOptions['compiler'],
    ) =>
      createDevServer(
        options,
        port,
        serverOptions,
        compiler as unknown as RspackCompiler,
      ),
    startDevServerOptions,
  );
}
