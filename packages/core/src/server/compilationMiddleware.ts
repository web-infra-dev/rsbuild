import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Compiler, MultiCompiler, Stats } from '@rspack/core';
import { applyToCompiler } from '../helpers';
import type {
  DevConfig,
  EnvironmentContext,
  NextFunction,
  ServerConfig,
} from '../types';
import { getResolvedClientConfig } from './hmrFallback';

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
  compiler,
  clientPaths,
  devConfig,
  resolvedClientConfig,
  token,
}: {
  compiler: Compiler;
  clientPaths: string[];
  devConfig: DevConfig;
  resolvedClientConfig: DevConfig['client'];
  token: string;
}) {
  if (!isClientCompiler(compiler)) {
    return;
  }

  new compiler.webpack.DefinePlugin({
    RSBUILD_WEB_SOCKET_TOKEN: JSON.stringify(token),
    RSBUILD_CLIENT_CONFIG: JSON.stringify(devConfig.client),
    RSBUILD_RESOLVED_CLIENT_CONFIG: JSON.stringify(resolvedClientConfig),
    RSBUILD_DEV_LIVE_RELOAD: devConfig.liveReload,
  }).apply(compiler);

  for (const clientPath of clientPaths) {
    new compiler.webpack.EntryPlugin(compiler.context, clientPath, {
      name: undefined,
    }).apply(compiler);
  }
}

type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: NextFunction,
) => Promise<void>;

export type CompilationMiddlewareOptions = {
  /**
   * To ensure HMR works, the devMiddleware need inject the HMR client path into page when HMR enable.
   */
  clientPaths?: string[];
  /**
   * Should trigger when compiler hook called
   */
  callbacks: ServerCallbacks;
  devConfig: DevConfig;
  serverConfig: ServerConfig;
  environments: Record<string, EnvironmentContext>;
};

export type CompilationMiddleware = Middleware & {
  close: (callback: (err: Error | null | undefined) => void) => any;
  watch: () => void;
};

/**
 * The CompilationMiddleware handles compiler setup for development:
 * - Call `compiler.watch` (handled by rsbuild-dev-middleware)
 * - Inject the HMR client path into page
 * - Notify server when compiler hooks are triggered
 */
export const getCompilationMiddleware = async (
  compiler: Compiler | MultiCompiler,
  options: CompilationMiddlewareOptions,
): Promise<CompilationMiddleware> => {
  const { default: rsbuildDevMiddleware } = await import(
    '../../compiled/rsbuild-dev-middleware/index.js'
  );

  const { clientPaths, callbacks, devConfig, serverConfig } = options;
  const resolvedClientConfig = await getResolvedClientConfig(
    devConfig.client,
    serverConfig,
  );

  const setupCompiler = (compiler: Compiler, index: number) => {
    const token = Object.values(options.environments).find(
      (env) => env.index === index,
    )?.webSocketToken;

    if (!token) {
      return;
    }

    if (clientPaths) {
      applyHMREntry({
        compiler,
        clientPaths,
        devConfig,
        resolvedClientConfig,
        token,
      });
    }
    // register hooks for each compilation, update socket stats if recompiled
    setupServerHooks({
      compiler,
      callbacks,
      token,
    });
  };

  applyToCompiler(compiler, setupCompiler);

  return rsbuildDevMiddleware(compiler, {
    // weak is enough in dev
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests#weak_validation
    etag: 'weak',
    publicPath: '/',
    stats: false,
    serverSideRender: true,
    writeToDisk: devConfig.writeToDisk,
  });
};
