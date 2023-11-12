import type {
  RsbuildConfig,
  Context,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  CompilerTapFn,
  DevConfig,
  RsbuildEntry,
} from './types';
import { getPort } from './port';
import deepmerge from '../compiled/deepmerge';
import { color } from './color';
import { logger as defaultLogger, Logger } from './logger';
import { DEFAULT_PORT, DEFAULT_DEV_HOST } from './constants';
import { createAsyncHook } from './createHook';
import type { Compiler } from '@rspack/core';
import { normalizeUrl } from './url';

/*
 * format route by entry and adjust the index route to be the first
 */
export const formatRoutes = (entry: RsbuildEntry) => {
  return (
    Object.keys(entry)
      .map((name) => ({
        name,
        route: name === 'index' ? '' : name,
      }))
      // adjust the index route to be the first
      .sort((a) => (a.name === 'index' ? -1 : 1))
  );
};

export function printServerURLs(
  urls: Array<{ url: string; label: string }>,
  entry: RsbuildEntry,
  logger: Logger = defaultLogger,
) {
  const routes = formatRoutes(entry);

  let message = '';
  if (routes.length === 1) {
    message = urls
      .map(
        ({ label, url }) =>
          `  ${`> ${label.padEnd(10)}`}${color.cyan(
            normalizeUrl(`${url}/${routes[0].route}`),
          )}\n`,
      )
      .join('');
  } else {
    const maxNameLength = Math.max(...routes.map((r) => r.name.length));
    urls.forEach(({ label, url }) => {
      message += `  ${color.bold(`> ${label}`)}\n`;
      routes.forEach((r) => {
        message += `    ${color.yellow('○')}  ${color.yellow(
          r.name.padEnd(maxNameLength + 8),
        )}${color.cyan(normalizeUrl(`${url}/${r.route}`))}\n`;
      });
    });
  }

  logger.log(message);
}

/**
 * hmr socket connect path
 */
export const HMR_SOCK_PATH = '/rsbuild-hmr';

export const mergeDevOptions = ({
  rsbuildConfig,
  port,
}: {
  rsbuildConfig: RsbuildConfig;
  port: number;
}) => {
  const defaultDevConfig: DevConfig = {
    client: {
      path: HMR_SOCK_PATH,
      port: port.toString(),
      // By default it is set to "location.hostname"
      host: '',
      // By default it is set to "location.protocol === 'https:' ? 'wss' : 'ws'""
      protocol: '',
    },
    compress: true,
    port,
    devMiddleware: {
      writeToDisk: (file: string) => !file.includes('.hot-update.'),
    },
  };

  const devServerConfig = rsbuildConfig.dev
    ? deepmerge(defaultDevConfig, rsbuildConfig.dev)
    : defaultDevConfig;

  devServerConfig.port = port;

  return devServerConfig;
};

export const getDevOptions = async ({
  rsbuildConfig,
  strictPort,
  getPortSilently,
}: {
  rsbuildConfig: RsbuildConfig;
  strictPort?: boolean;
  getPortSilently?: boolean;
}) => {
  const port = await getPort(rsbuildConfig.dev?.port || DEFAULT_PORT, {
    strictPort,
    silent: getPortSilently,
  });

  const host = rsbuildConfig.dev?.host || DEFAULT_DEV_HOST;

  const https = Boolean(rsbuildConfig.dev?.https) || false;

  const devServerConfig = mergeDevOptions({ rsbuildConfig, port });

  return { devServerConfig, port, host, https };
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
