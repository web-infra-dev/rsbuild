import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import { HTML_REGEX } from '../constants';
import { isMultiCompiler } from '../helpers';
import { getPathnameFromUrl } from '../helpers/path';
import type {
  EnvironmentContext,
  NextFunction,
  NormalizedDevConfig,
  NormalizedServerConfig,
  Rspack,
} from '../types';
import {
  type CompilationMiddleware,
  getCompilationMiddleware,
} from './compilationMiddleware';
import { stripBase } from './helper';
import { SocketServer } from './socketServer';

const require = createRequire(import.meta.url);

type Options = {
  publicPaths: string[];
  environments: Record<string, EnvironmentContext>;
  dev: NormalizedDevConfig;
  server: NormalizedServerConfig;
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
};

// allow to configure dev.writeToDisk in environments
const formatDevConfig = (
  config: NormalizedDevConfig,
  environments: Record<string, EnvironmentContext>,
): NormalizedDevConfig => {
  const writeToDiskValues = Object.values(environments).map(
    (env) => env.config.dev.writeToDisk,
  );
  if (new Set(writeToDiskValues).size === 1) {
    return {
      ...config,
      writeToDisk: writeToDiskValues[0],
    };
  }

  return {
    ...config,
    writeToDisk(filePath: string, compilationName?: string) {
      let { writeToDisk } = config;
      if (compilationName && environments[compilationName]) {
        writeToDisk =
          environments[compilationName].config.dev.writeToDisk ?? writeToDisk;
      }
      return typeof writeToDisk === 'function'
        ? writeToDisk(filePath)
        : writeToDisk!;
    },
  };
};

function getClientPaths(devConfig: NormalizedDevConfig) {
  const clientPaths: string[] = [];

  if (!devConfig.hmr && !devConfig.liveReload) {
    return clientPaths;
  }

  clientPaths.push(require.resolve('@rsbuild/core/client/hmr'));

  if (devConfig.client?.overlay) {
    clientPaths.push(`${require.resolve('@rsbuild/core/client/overlay')}`);
  }

  return clientPaths;
}

/**
 * Setup compiler-related logic:
 * 1. setup rsbuild-dev-middleware
 * 2. establish webSocket connect
 */
export class CompilationManager {
  public middleware!: CompilationMiddleware;

  public outputFileSystem: Rspack.OutputFileSystem;

  private devConfig: NormalizedDevConfig;

  private serverConfig: NormalizedServerConfig;

  public compiler: Rspack.Compiler | Rspack.MultiCompiler;

  private publicPaths: string[];

  public socketServer: SocketServer;

  constructor({ dev, server, compiler, publicPaths, environments }: Options) {
    this.devConfig = formatDevConfig(dev, environments);
    this.serverConfig = server;
    this.compiler = compiler;
    this.publicPaths = publicPaths;
    this.outputFileSystem = fs;
    this.socketServer = new SocketServer(dev);
  }

  public async init(): Promise<void> {
    await this.setupCompilationMiddleware();
    await this.socketServer.prepare();

    // Get the latest outputFileSystem from rsbuild-dev-middleware
    const { compiler } = this;
    this.outputFileSystem =
      (isMultiCompiler(compiler)
        ? compiler.compilers[0].outputFileSystem
        : compiler.outputFileSystem) || fs;
  }

  /**
   * Call `compiler.watch()` to start compiling.
   */
  public watch(): void {
    this.middleware.watch();
  }

  public async close(): Promise<void> {
    // socketServer close should before app close
    await this.socketServer.close();

    if (this.middleware) {
      await new Promise<void>((resolve) => {
        this.middleware.close(() => {
          resolve();
        });
      });
    }

    // `middleware.close()` only stop watching for file changes, compiler should also be closed.
    await new Promise<void>((resolve) => {
      this.compiler.close(() => {
        resolve();
      });
    });
  }

  public readFileSync = (fileName: string): string => {
    if ('readFileSync' in this.outputFileSystem) {
      // bundle require needs a synchronous method, although readFileSync is not within the
      // outputFileSystem type definition, but nodejs fs API implemented.
      // @ts-expect-error
      return this.outputFileSystem.readFileSync(fileName, 'utf-8');
    }
    return fs.readFileSync(fileName, 'utf-8');
  };

  private async setupCompilationMiddleware(): Promise<void> {
    const { devConfig, serverConfig, publicPaths } = this;

    const callbacks = {
      onInvalid: (compilationId?: string, fileName?: string | null) => {
        // reload page when HTML template changed
        if (typeof fileName === 'string' && HTML_REGEX.test(fileName)) {
          this.socketServer.sockWrite({
            type: 'static-changed',
            compilationId,
          });
          return;
        }
        this.socketServer.sockWrite({
          type: 'invalid',
          compilationId,
        });
      },
      onDone: (stats: any) => {
        this.socketServer.updateStats(stats);
      },
    };

    const clientPaths = getClientPaths(devConfig);

    const middleware = await getCompilationMiddleware(this.compiler, {
      callbacks,
      clientPaths,
      devConfig,
      serverConfig,
    });

    const { base } = serverConfig;
    const assetPrefixes = publicPaths
      .map(getPathnameFromUrl)
      .map((prefix) =>
        base && base !== '/' ? stripBase(prefix, base) : prefix,
      );

    const wrapper = async (
      req: IncomingMessage,
      res: ServerResponse,
      next: NextFunction,
    ) => {
      const { url } = req;
      const assetPrefix =
        url && assetPrefixes.find((prefix) => url.startsWith(prefix));

      // slice publicPath, static asset have publicPath but html does not.
      if (assetPrefix && assetPrefix !== '/') {
        req.url = url.slice(assetPrefix.length - 1);

        middleware(req, res, (...args) => {
          req.url = url;
          next(...args);
        });
      } else {
        middleware(req, res, next);
      }
    };

    wrapper.close = middleware.close;
    wrapper.watch = middleware.watch;

    // wrap rsbuild-dev-middleware to handle HTML file（without publicPath）
    // maybe we should serve HTML file by sirv
    this.middleware = wrapper;
  }
}
