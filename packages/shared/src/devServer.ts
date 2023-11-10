import type {
  RsbuildConfig,
  Context,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  CompilerTapFn,
  DevServerOptions,
} from './types';
import { getPort } from './port';
import deepmerge from 'deepmerge';
import { color } from './color';
import { logger as defaultLogger, Logger } from './logger';
import { DEFAULT_PORT, DEFAULT_DEV_HOST } from './constants';
import { createAsyncHook } from './createHook';
import { mergeChainedOptions } from './mergeChainedOptions';
import type { Compiler } from '@rspack/core';

export function printServerURLs(
  urls: Array<{ url: string; label: string }>,
  logger: Logger = defaultLogger,
) {
  const message = urls
    .map(({ label, url }) => `  ${`> ${label.padEnd(10)}`}${color.cyan(url)}\n`)
    .join('');

  logger.log(message);
}

export const getDevOptions = async ({
  rsbuildConfig,
  strictPort,
  getPortSilently,
}: {
  rsbuildConfig: RsbuildConfig;
  strictPort: boolean;
  getPortSilently?: boolean;
}) => {
  const port = await getPort(rsbuildConfig.dev?.port || DEFAULT_PORT, {
    strictPort,
    silent: getPortSilently,
  });

  const host = rsbuildConfig.dev?.host || DEFAULT_DEV_HOST;

  const https = Boolean(rsbuildConfig.dev?.https) || false;

  const devServerConfig = await getDevServerOptions({
    rsbuildConfig,
    port,
  });

  return { port, host, https, devServerConfig };
};

export const getDevServerOptions = async ({
  rsbuildConfig,
  port,
}: {
  rsbuildConfig: RsbuildConfig;
  port: number;
}): Promise<DevServerOptions> => {
  const defaultDevConfig = {
    hot: rsbuildConfig.dev?.hmr ?? true,
    watch: true,
    client: {
      port: port.toString(),
    },
    port,
    liveReload: rsbuildConfig.dev?.hmr ?? true,
    devMiddleware: {
      writeToDisk: (file: string) => !file.includes('.hot-update.'),
    },
    https: rsbuildConfig.dev?.https,
  };

  return mergeChainedOptions({
    defaults: defaultDevConfig,
    options: rsbuildConfig.tools?.devServer,
    mergeFn: deepmerge,
  });
};

/** The context used by startDevServer. */
export type DevServerContext = Context & {
  hooks: {
    onBeforeStartDevServerHook: ReturnType<
      typeof createAsyncHook<OnBeforeStartDevServerFn>
    >;
    onAfterStartDevServerHook: ReturnType<
      typeof createAsyncHook<OnAfterStartDevServerFn>
    >;
  };
  config: Readonly<RsbuildConfig>;
};

type ServerCallbacks = {
  onInvalid: () => void;
  onDone: (stats: any) => void;
};

export const setupServerHooks = (
  compiler: {
    name?: Compiler['name'];
    hooks: {
      compile: CompilerTapFn<ServerCallbacks['onInvalid']>;
      invalid: CompilerTapFn<ServerCallbacks['onInvalid']>;
      done: CompilerTapFn<ServerCallbacks['onDone']>;
    };
  },
  hookCallbacks: ServerCallbacks,
) => {
  if (compiler.name === 'server') {
    return;
  }

  const { compile, invalid, done } = compiler.hooks;

  compile.tap('rsbuild-dev-server', hookCallbacks.onInvalid);
  invalid.tap('rsbuild-dev-server', hookCallbacks.onInvalid);
  done.tap('rsbuild-dev-server', hookCallbacks.onDone);
};

export const isClientCompiler = (compiler: {
  options: {
    target?: Compiler['options']['target'];
  };
}) => {
  const { target } = compiler.options;

  if (target) {
    return Array.isArray(target) ? target.includes('web') : target === 'web';
  }

  return false;
};
