import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Compilation, Compiler, MultiCompiler } from '@rspack/core';
import { logger } from '../../logger';
import type { Context, WithOptional } from '../index';

export function setupWriteToDisk(
  context: WithOptional<Context, 'watching' | 'outputFileSystem'>,
): void {
  const compilers: Compiler[] = (context.compiler as MultiCompiler)
    .compilers || [context.compiler as Compiler];

  for (const compiler of compilers) {
    compiler.hooks.emit.tap('DevMiddleware', () => {
      if ((compiler as any).hasWebpackDevMiddlewareAssetEmittedCallback) {
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
          const { writeToDisk: filter } = context.options;
          const allowWrite =
            filter && typeof filter === 'function'
              ? filter(targetPath, (compilation as any).name)
              : true;

          if (!allowWrite) {
            return callback();
          }

          const dir = path.dirname(targetPath);
          const name = compiler.options.name
            ? `Child "${compiler.options.name}": `
            : '';

          return fs.mkdir(
            dir,
            { recursive: true },
            (mkdirError: NodeJS.ErrnoException | null) => {
              if (mkdirError) {
                logger.error(
                  `[rsbuild-dev-middleware] ${name}Unable to write "${dir}" directory to disk:\n${mkdirError}`,
                );

                return callback(mkdirError);
              }

              return fs.writeFile(
                targetPath,
                content,
                (writeFileError: NodeJS.ErrnoException | null) => {
                  if (writeFileError) {
                    logger.error(
                      `[rsbuild-dev-middleware] ${name}Unable to write "${targetPath}" asset to disk:\n${writeFileError}`,
                    );

                    return callback(writeFileError);
                  }

                  logger.debug(
                    `[rsbuild-dev-middleware] ${name}Asset written to disk: "${targetPath}"`,
                  );

                  return callback();
                },
              );
            },
          );
        },
      );

      // @ts-ignore
      (compiler as any).hasWebpackDevMiddlewareAssetEmittedCallback = true;
    });
  }
}
