import type {
  Routes,
  DevConfig,
  RsbuildEntry,
  RsbuildConfig,
  CompilerTapFn,
  OutputStructure,
} from './types';
import { getPort } from './port';
import deepmerge from '../compiled/deepmerge';
import { color } from './utils';
import { logger as defaultLogger, Logger } from './logger';
import { DEFAULT_PORT, DEFAULT_DEV_HOST } from './constants';
import type { Compiler } from '@rspack/core';
import { normalizeUrl } from './url';

/*
 * format route by entry and adjust the index route to be the first
 */
export const formatRoutes = (
  entry: RsbuildEntry,
  prefix: string | undefined,
  outputStructure: OutputStructure | undefined,
): Routes => {
  return (
    Object.keys(entry)
      .map((name) => ({
        name,
        route:
          (prefix ? `${prefix}/` : '') +
          // fix case: /html/index/index.html
          (name === 'index' && outputStructure !== 'nested' ? '' : name),
      }))
      // adjust the index route to be the first
      .sort((a) => (a.name === 'index' ? -1 : 1))
  );
};

export function printServerURLs(
  urls: Array<{ url: string; label: string }>,
  routes: Routes,
  logger: Logger = defaultLogger,
) {
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
    writeToDisk: (file: string) => !file.includes('.hot-update.'),
  };

  const devConfig = rsbuildConfig.dev
    ? deepmerge(defaultDevConfig, rsbuildConfig.dev)
    : defaultDevConfig;

  return devConfig;
};

export const getServerOptions = async ({
  rsbuildConfig,
  getPortSilently,
}: {
  rsbuildConfig: RsbuildConfig;
  getPortSilently?: boolean;
}) => {
  const port = await getPort(
    rsbuildConfig.server?.port || DEFAULT_PORT,
    rsbuildConfig.server?.strictPort || false,
    {
      silent: getPortSilently,
    },
  );

  const host = rsbuildConfig.server?.host || DEFAULT_DEV_HOST;

  const https = Boolean(rsbuildConfig.server?.https) || false;

  return { port, host, https, serverConfig: rsbuildConfig.server || {} };
};

export const getDevOptions = async ({
  rsbuildConfig,
  getPortSilently,
}: {
  rsbuildConfig: RsbuildConfig;
  getPortSilently?: boolean;
}) => {
  const { port, host, https, serverConfig } = await getServerOptions({
    rsbuildConfig,
    getPortSilently,
  });

  const devConfig = mergeDevOptions({ rsbuildConfig, port });

  return {
    devServerConfig: {
      ...serverConfig,
      ...devConfig,
    },
    port,
    host,
    https,
  };
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
