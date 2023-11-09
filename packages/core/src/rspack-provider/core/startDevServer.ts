import {
  debug,
  StartDevServerOptions,
  getDevServerOptions,
  type RspackCompiler,
  type RspackMultiCompiler,
} from '@rsbuild/shared';
import { createCompiler } from './createCompiler';
import { getDevMiddleware } from './devMiddleware';
import { initConfigs, type InitConfigsOptions } from './initConfigs';
import { createDevServer as createServer } from '../../server';

type ServerOptions = Exclude<StartDevServerOptions['serverOptions'], undefined>;

export async function createDevServer(
  options: InitConfigsOptions,
  port: number,
  serverOptions: ServerOptions,
  customCompiler?: RspackCompiler | RspackMultiCompiler,
) {
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
  const { devConfig } = await getDevServerOptions({
    rsbuildConfig,
    serverOptions,
    port,
  });

  const server = await createServer({
    pwd: options.context.rootPath,
    devMiddleware: getDevMiddleware(compiler),
    ...serverOptions,
    dev: devConfig,
  });

  debug('create dev server done');

  return server;
}
