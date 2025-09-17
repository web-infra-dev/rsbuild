/**
 * The dev middleware is modified based on
 * https://github.com/webpack/webpack-dev-middleware
 *
 * MIT Licensed
 * Copyright JS Foundation and other contributors
 * https://github.com/webpack/webpack-dev-middleware/blob/master/LICENSE
 */
import type { Stats as FSStats, ReadStream } from 'node:fs';
import type { ServerResponse as NodeServerResponse } from 'node:http';
import type {
  Compiler,
  Configuration,
  MultiCompiler,
  MultiStats,
  Stats,
  Watching,
} from '@rspack/core';
import { isMultiCompiler } from '../helpers';
import { logger } from '../logger';
import type { RequestHandler } from '../types';
import { wrapper as createMiddleware } from './middleware';
import { setupHooks } from './utils/setupHooks';
import { setupOutputFileSystem } from './utils/setupOutputFileSystem';
import { setupWriteToDisk } from './utils/setupWriteToDisk';

const noop = () => {};

export type ServerResponse = NodeServerResponse & {
  locals?: { webpack?: { devMiddleware?: Context } };
};

export type MultiWatching = ReturnType<MultiCompiler['watch']>;

// TODO: refine types to match underlying fs-like implementations
export type OutputFileSystem = {
  createReadStream?: (
    p: string,
    opts: { start: number; end: number },
  ) => ReadStream;
  statSync?: (p: string) => FSStats;
  lstat?: (p: string) => unknown; // TODO: type
  readFileSync?: (p: string) => Buffer;
};

export type Callback = (stats?: Stats | MultiStats) => void;

export type Options = {
  writeToDisk?:
    | boolean
    | ((targetPath: string, compilationName?: string) => boolean);
  publicPath?: NonNullable<Configuration['output']>['publicPath'];
};

export type Context = {
  state: boolean;
  stats: Stats | MultiStats | undefined;
  callbacks: Callback[];
  options: Options;
  compilers: Compiler[];
  watching: Watching | MultiWatching | undefined;
  outputFileSystem: OutputFileSystem;
};

export type FilledContext = Omit<Context, 'watching'> & {
  watching: Watching | MultiWatching;
};

export type Close = (callback: (err: Error | null | undefined) => void) => void;

export type API = RequestHandler & {
  watch: () => void;
  close: Close;
};

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export async function devMiddleware(
  compiler: Compiler | MultiCompiler,
  options: Options = {},
): Promise<API> {
  const compilers = isMultiCompiler(compiler) ? compiler.compilers : [compiler];
  const context: WithOptional<Context, 'watching' | 'outputFileSystem'> = {
    state: false,
    stats: undefined,
    callbacks: [],
    options,
    compilers,
  };

  setupHooks(context, compiler);

  if (options.writeToDisk) {
    setupWriteToDisk(context);
  }

  context.outputFileSystem = await setupOutputFileSystem(options, compilers);

  const filledContext = context as FilledContext;

  const instance = (createMiddleware as (ctx: FilledContext) => API)(
    filledContext,
  );

  // API
  instance.watch = () => {
    if (compiler.watching) {
      context.watching = compiler.watching;
    } else {
      const errorHandler = (error: Error | null | undefined) => {
        if (error) {
          if (error.message?.includes('× Error:')) {
            error.message = error.message.replace('× Error:', '').trim();
          }
          logger.error(error);
        }
      };

      if (compilers.length > 1) {
        const watchOptions = compilers.map(
          (childCompiler) => childCompiler.options.watchOptions || {},
        );
        context.watching = compiler.watch(watchOptions, errorHandler);
      } else {
        const watchOptions = compilers[0].options.watchOptions || {};
        context.watching = compiler.watch(watchOptions, errorHandler);
      }
    }
  };

  instance.close = (callback: (err?: Error | null) => void = noop) => {
    filledContext.watching?.close(callback);
  };

  return instance;
}
