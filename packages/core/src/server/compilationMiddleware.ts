import { createRequire } from 'node:module';
import type { Compiler, MultiCompiler, Stats } from '@rspack/core';
import { devMiddleware } from '../dev-middleware';
import { applyToCompiler } from '../helpers';
import type {
  Connect,
  EnvironmentContext,
  NormalizedConfig,
  NormalizedDevConfig,
  NormalizedEnvironmentConfig,
  WriteToDisk,
} from '../types';
import { resolveHostname } from './hmrFallback';

const require = createRequire(import.meta.url);
let hmrClientPath: string;
let overlayClientPath: string;

function getClientPaths(devConfig: NormalizedDevConfig) {
  const clientPaths: string[] = [];

  if (!devConfig.hmr && !devConfig.liveReload) {
    return clientPaths;
  }

  if (!hmrClientPath) {
    hmrClientPath = require.resolve('@rsbuild/core/client/hmr');
  }
  clientPaths.push(hmrClientPath);

  if (devConfig.client?.overlay) {
    if (!overlayClientPath) {
      overlayClientPath = require.resolve('@rsbuild/core/client/overlay');
    }
    clientPaths.push(overlayClientPath);
  }

  return clientPaths;
}

export const isClientCompiler = (compiler: {
  options: {
    target?: Compiler['options']['target'];
  };
}): boolean => {
  const { target } = compiler.options;

  if (target) {
    return Array.isArray(target) ? target.includes('web') : target === 'web';
  }

  return false;
};

const isNodeCompiler = (compiler: {
  options: {
    target?: Compiler['options']['target'];
  };
}) => {
  const { target } = compiler.options;

  if (target) {
    return Array.isArray(target) ? target.includes('node') : target === 'node';
  }

  return false;
};

export type ServerCallbacks = {
  onInvalid: (token: string, fileName?: string | null) => void;
  onDone: (token: string, stats: Stats) => void;
};

export const setupServerHooks = ({
  compiler,
  token,
  callbacks: { onDone, onInvalid },
}: {
  compiler: Compiler;
  token: string;
  callbacks: ServerCallbacks;
}): void => {
  // TODO: node SSR HMR is not supported yet
  if (isNodeCompiler(compiler)) {
    return;
  }

  const { compile, invalid, done } = compiler.hooks;

  compile.tap('rsbuild-dev-server', () => {
    onInvalid(token);
  });
  invalid.tap('rsbuild-dev-server', (fileName) => {
    onInvalid(token, fileName);
  });
  done.tap('rsbuild-dev-server', (stats) => {
    onDone(token, stats);
  });
};

function applyHMREntry({
  config,
  compiler,
  token,
  resolvedHost,
  resolvedPort,
}: {
  config: NormalizedEnvironmentConfig;
  compiler: Compiler;
  token: string;
  resolvedHost: string;
  resolvedPort: number;
}) {
  if (!isClientCompiler(compiler)) {
    return;
  }

  const clientPaths = getClientPaths(config.dev);
  if (!clientPaths.length) {
    return;
  }

  const clientConfig = { ...config.dev.client };
  if (clientConfig.port === '<port>') {
    clientConfig.port = resolvedPort;
  }

  new compiler.webpack.DefinePlugin({
    RSBUILD_WEB_SOCKET_TOKEN: JSON.stringify(token),
    RSBUILD_CLIENT_CONFIG: JSON.stringify(clientConfig),
    RSBUILD_SERVER_HOST: JSON.stringify(resolvedHost),
    RSBUILD_SERVER_PORT: JSON.stringify(resolvedPort),
    RSBUILD_DEV_LIVE_RELOAD: config.dev.liveReload,
  }).apply(compiler);

  for (const clientPath of clientPaths) {
    new compiler.webpack.EntryPlugin(compiler.context, clientPath, {
      name: undefined,
    }).apply(compiler);
  }
}

export type CompilationMiddleware = Connect.NextHandleFunction & {
  close: (callback: (err: Error | null | undefined) => void) => any;
  watch: () => void;
};

/**
 * Resolve writeToDisk config across multiple environments.
 * Returns the unified config if all environments have the same value,
 * otherwise returns a function that resolves config based on compilation.
 */
const resolveWriteToDiskConfig = (
  config: NormalizedDevConfig,
  environments: Record<string, EnvironmentContext>,
): WriteToDisk => {
  const writeToDiskValues = Object.values(environments).map(
    (env) => env.config.dev.writeToDisk,
  );
  if (new Set(writeToDiskValues).size === 1) {
    return writeToDiskValues[0];
  }

  return (filePath: string, name?: string) => {
    let { writeToDisk } = config;
    if (name && environments[name]) {
      writeToDisk = environments[name].config.dev.writeToDisk ?? writeToDisk;
    }
    return typeof writeToDisk === 'function'
      ? writeToDisk(filePath)
      : writeToDisk;
  };
};

/**
 * The CompilationMiddleware handles compiler setup for development:
 * - Call `compiler.watch` (handled by rsbuild-dev-middleware)
 * - Inject the HMR client path into page
 * - Notify server when compiler hooks are triggered
 */
export const getCompilationMiddleware = async ({
  config,
  compiler,
  callbacks,
  environments,
  resolvedPort,
}: {
  config: NormalizedConfig;
  compiler: Compiler | MultiCompiler;
  /**
   * Should trigger when compiler hook called
   */
  callbacks: ServerCallbacks;
  environments: Record<string, EnvironmentContext>;
  resolvedPort: number;
}): Promise<CompilationMiddleware> => {
  const resolvedHost = await resolveHostname(config.server.host);

  const setupCompiler = (compiler: Compiler, index: number) => {
    const environment = Object.values(environments).find(
      (env) => env.index === index,
    );
    if (!environment) {
      return;
    }

    const token = environment.webSocketToken;
    if (!token) {
      return;
    }

    applyHMREntry({
      token,
      config: environment.config,
      compiler,
      resolvedHost,
      resolvedPort,
    });

    // register hooks for each compilation, update socket stats if recompiled
    setupServerHooks({
      compiler,
      callbacks,
      token,
    });
  };

  applyToCompiler(compiler, setupCompiler);

  return await devMiddleware(compiler, {
    publicPath: '/',
    writeToDisk: resolveWriteToDiskConfig(config.dev, environments),
  });
};
