import fs from 'node:fs';
import path from 'node:path';
import type { Compilation, Compiler } from '@rspack/core';
import type { Logger } from '../../logger';
import type { EnvironmentContext, NormalizedDevConfig } from '../../types';

declare module '@rspack/core' {
  interface Compiler {
    __hasRsbuildAssetEmittedCallback?: boolean;
  }
}

export type ResolvedWriteToDisk =
  boolean | ((filePath: string, name?: string) => boolean);

/**
 * Resolve writeToDisk config across multiple environments.
 * Returns the unified config if all environments have the same value,
 * otherwise returns a function that resolves config based on compilation.
 */
export const resolveWriteToDiskConfig = (
  config: NormalizedDevConfig,
  environments: Record<string, EnvironmentContext>,
  environmentList: EnvironmentContext[],
): ResolvedWriteToDisk => {
  const writeToDiskValues = environmentList.map(
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
 * Copy selected assets from the compiler's output file system to disk.
 * Rspack always writes to compiler.outputFileSystem; this hook handles any
 * additional disk writes requested by dev.writeToDisk:
 *
 * - With `true` and the native Node.js fs, Rspack already writes to disk,
 *   so no extra write is needed.
 * - With a predicate, Rspack writes to memory and this hook copies only
 *   the files accepted by the predicate to disk.
 * - With different settings across environments, Rspack writes to memory
 *   and the resolved predicate selects files using each environment's setting.
 * - With `true` and a custom output file system, keep copying to disk because
 *   the custom file system may store assets somewhere else, such as memory.
 *
 * When all environments disable writeToDisk, the caller skips this setup.
 */
export function setupWriteToDisk(
  compilers: Compiler[],
  writeToDisk: ResolvedWriteToDisk,
  logger: Logger,
): void {
  for (const compiler of compilers) {
    compiler.hooks.emit.tap('DevMiddleware', () => {
      if (compiler.__hasRsbuildAssetEmittedCallback) {
        return;
      }

      compiler.hooks.assetEmitted.tapAsync(
        'DevMiddleware',
        (
          _file: string,
          info: {
            targetPath: string;
            content: Buffer;
            compilation: Compilation;
          },
          callback: (err?: Error) => void,
        ) => {
          // Rspack already writes to disk with the native fs.
          if (compiler.outputFileSystem === fs) {
            callback();
            return;
          }

          const { targetPath, compilation } = info;
          const allowWrite =
            typeof writeToDisk === 'function'
              ? writeToDisk(targetPath, compilation.name)
              : true;

          if (!allowWrite) {
            callback();
            return;
          }

          // Rspack creates the content buffer on access, so only read it
          // after the file is accepted.
          const { content } = info;
          const dir = path.dirname(targetPath);
          const name = compiler.options.name
            ? `Child "${compiler.options.name}": `
            : '';

          fs.mkdir(
            dir,
            { recursive: true },
            (mkdirError: NodeJS.ErrnoException | null) => {
              if (mkdirError) {
                logger.error(
                  `[rsbuild:middleware] ${name}Unable to write "${dir}" directory to disk:\n${mkdirError.message}`,
                );

                callback(mkdirError);
                return;
              }

              fs.writeFile(
                targetPath,
                content,
                (writeFileError: NodeJS.ErrnoException | null) => {
                  if (writeFileError) {
                    logger.error(
                      `[rsbuild:middleware] ${name}Unable to write "${targetPath}" asset to disk:\n${writeFileError.message}`,
                    );

                    callback(writeFileError);
                    return;
                  }

                  callback();
                },
              );
            },
          );
        },
      );

      compiler.__hasRsbuildAssetEmittedCallback = true;
    });
  }
}
