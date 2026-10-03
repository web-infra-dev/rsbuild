import fs from 'node:fs';
import path from 'node:path';
import type { Compiler } from '@rspack/core';
import type { Logger } from '../../logger';
import type { WriteToDisk } from '../../types';

declare module '@rspack/core' {
  interface Compiler {
    __hasRsbuildAssetEmittedCallback?: boolean;
  }
}

/**
 * Copy selected assets from the compiler's output file system to disk.
 * Rspack always writes to compiler.outputFileSystem; this hook handles any
 * additional disk writes requested by each environment's dev.writeToDisk:
 *
 * - With `false`, no hook is registered, so the environment's assets are
 *   never read for disk writes.
 * - With `true` and the native Node.js fs, Rspack already writes to disk,
 *   so no extra write is needed.
 * - With a predicate, Rspack writes to memory and this hook copies only
 *   the files accepted by the predicate to disk.
 * - With `true` and a non-native output file system, copy every file to disk.
 *   This happens when environments have different settings and share the
 *   memory fs, or with a custom output file system that may store assets
 *   somewhere else.
 *
 * `writeToDiskList` holds the writeToDisk value for each compiler, in order.
 * When all environments disable writeToDisk, the caller skips this setup.
 */
export function setupWriteToDisk(
  compilers: Compiler[],
  writeToDiskList: WriteToDisk[],
  logger: Logger,
): void {
  for (const [index, compiler] of compilers.entries()) {
    const writeToDisk = writeToDiskList[index];
    if (!writeToDisk) {
      continue;
    }

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
          },
          callback: (err?: Error) => void,
        ) => {
          // Rspack already writes to disk with the native fs.
          if (compiler.outputFileSystem === fs) {
            callback();
            return;
          }

          const { targetPath } = info;
          if (typeof writeToDisk === 'function' && !writeToDisk(targetPath)) {
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
