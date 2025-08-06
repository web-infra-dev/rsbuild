import fs from 'node:fs';
import type { Stats } from '@rspack/core';
import { isMultiCompiler } from '../helpers';
import { getPathnameFromUrl } from '../helpers/path';
import type {
  EnvironmentContext,
  NormalizedDevConfig,
  NormalizedServerConfig,
  Rspack,
} from '../types';
import {
  type CompilationMiddleware,
  getCompilationMiddleware,
  type ServerCallbacks,
} from './compilationMiddleware';
import { stripBase } from './helper';
import { SocketServer } from './socketServer';

type Options = {
  publicPaths: string[];
  environments: Record<string, EnvironmentContext>;
  dev: NormalizedDevConfig;
  server: NormalizedServerConfig;
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
};

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

  private environments: Record<string, EnvironmentContext>;

  private publicPaths: string[];

  public socketServer: SocketServer;

  constructor({ dev, server, compiler, publicPaths, environments }: Options) {
    this.devConfig = dev;
    this.serverConfig = server;
    this.compiler = compiler;
    this.environments = environments;
    this.publicPaths = publicPaths;
    this.outputFileSystem = fs;
    this.socketServer = new SocketServer(dev, environments);
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
    const { devConfig, serverConfig, publicPaths, environments } = this;

    const callbacks: ServerCallbacks = {
      onInvalid: (token: string, fileName?: string | null) => {
        // reload page when HTML template changed
        if (typeof fileName === 'string' && fileName.endsWith('.html')) {
          this.socketServer.sockWrite({ type: 'static-changed' }, token);
          return;
        }
      },
      onDone: (token: string, stats: Stats) => {
        this.socketServer.updateStats(stats, token);
      },
    };

    const middleware = await getCompilationMiddleware(this.compiler, {
      callbacks,
      devConfig,
      serverConfig,
      environments,
    });

    const { base } = serverConfig;
    const assetPrefixes = publicPaths
      .map(getPathnameFromUrl)
      .map((prefix) =>
        base && base !== '/' ? stripBase(prefix, base) : prefix,
      );

    const wrapper: CompilationMiddleware = async (req, res, next) => {
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
