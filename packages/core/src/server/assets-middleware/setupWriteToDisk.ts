import fs from 'node:fs';
import path from 'node:path';
import type { Compilation, Compiler } from '@rspack/core';
import { logger } from '../../logger';
import type { Options } from './index';

declare module '@rspack/core' {
  interface Compiler {
    __hasRsbuildAssetEmittedCallback?: boolean;
  }
}

export function setupWriteToDisk(
  compilers: Compiler[],
  options: Options,
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
          const { targetPath, content, compilation } = info;
          const { writeToDisk: filter } = options;
          const allowWrite =
            filter && typeof filter === 'function'
              ? filter(targetPath, compilation.name)
              : true;

          if (!allowWrite) {
            callback();
            return;
          }

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
