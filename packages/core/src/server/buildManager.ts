import fs from 'node:fs';
import { isMultiCompiler } from '../helpers';
import { getPathnameFromUrl } from '../helpers/path';
import type { InternalContext, NormalizedConfig, Rspack } from '../types';
import { type AssetsMiddleware, assetsMiddleware } from './assets-middleware';
import { stripBase } from './helper';
import { SocketServer } from './socketServer';

type Options = {
  context: InternalContext;
  config: NormalizedConfig;
  compiler: Rspack.Compiler | Rspack.MultiCompiler;
  publicPaths: string[];
  resolvedPort: number;
};

/**
 * Setup compiler related logic:
 * 1. setup assets middleware
 * 2. establish webSocket connect
 */
export class BuildManager {
  public middleware!: AssetsMiddleware;

  public outputFileSystem: Rspack.OutputFileSystem;

  public socketServer: SocketServer;

  public compiler: Rspack.Compiler | Rspack.MultiCompiler;

  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: Biome bug
  private config: NormalizedConfig;

  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: Biome bug
  private publicPaths: string[];

  private resolvedPort: number;

  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: Biome bug
  private context: InternalContext;

  constructor({
    config,
    context,
    compiler,
    publicPaths,
    resolvedPort,
  }: Options) {
    this.config = config;
    this.context = context;
    this.compiler = compiler;
    this.publicPaths = publicPaths;
    this.resolvedPort = resolvedPort;
    this.outputFileSystem = fs;
    this.socketServer = new SocketServer(
      context,
      config.dev,
      () => this.outputFileSystem,
    );
  }

  public async init(): Promise<void> {
    await this.setupCompilationMiddleware();
    await this.socketServer.prepare();

    // Get the latest outputFileSystem from assets middleware
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
    const { config, context, publicPaths } = this;

    const middleware = await assetsMiddleware({
      config,
      compiler: this.compiler,
      socketServer: this.socketServer,
      environments: context.environments,
      resolvedPort: this.resolvedPort,
    });

    const { base } = config.server;
    const assetPrefixes = publicPaths
      .map(getPathnameFromUrl)
      .map((prefix) =>
        base && base !== '/' ? stripBase(prefix, base) : prefix,
      );

    const wrapper: AssetsMiddleware = (req, res, next) => {
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

    // wrap assets middleware to handle HTML file（without publicPath）
    this.middleware = wrapper;
  }
}
