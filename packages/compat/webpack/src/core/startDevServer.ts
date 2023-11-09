import {
  debug,
  StartDevServerOptions,
  getDevServerOptions,
} from '@rsbuild/shared';
import { createCompiler } from './createCompiler';
import { initConfigs, InitConfigsOptions } from './initConfigs';
import type { Compiler, MultiCompiler } from 'webpack';
import { getDevMiddleware } from './devMiddleware';
import { createDevServer as createServer } from '@rsbuild/core/server';

export async function createDevServer(
  options: InitConfigsOptions,
  port: number,
  serverOptions: Exclude<StartDevServerOptions['serverOptions'], undefined>,
  customCompiler?: Compiler | MultiCompiler,
) {
  let compiler: Compiler | MultiCompiler;
  if (customCompiler) {
    compiler = customCompiler;
  } else {
    const { webpackConfigs } = await initConfigs(options);
    compiler = await createCompiler({
      context: options.context,
      webpackConfigs,
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
