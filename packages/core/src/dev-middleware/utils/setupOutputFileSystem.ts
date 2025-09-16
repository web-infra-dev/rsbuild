import type { OutputFileSystem as RspackOutputFileSystem } from '@rspack/core';
import type { Context, OutputFileSystem, WithOptional } from '../index';

export async function setupOutputFileSystem(
  context: WithOptional<Context, 'watching' | 'outputFileSystem'>,
): Promise<void> {
  let outputFileSystem: unknown;
  const compilers =
    'compilers' in context.compiler
      ? context.compiler.compilers
      : [context.compiler];

  if (context.options.writeToDisk !== true) {
    const { createFsFromVolume, Volume } = await import(
      '../../../compiled/memfs/index.js'
    );
    outputFileSystem = createFsFromVolume(new Volume());
  } else {
    if (compilers.length > 1) {
      ({ outputFileSystem } = compilers[0]);
    } else {
      ({ outputFileSystem } = context.compiler);
    }
  }

  for (const compiler of compilers) {
    compiler.outputFileSystem = outputFileSystem as RspackOutputFileSystem;
  }

  context.outputFileSystem = outputFileSystem as OutputFileSystem;
}
