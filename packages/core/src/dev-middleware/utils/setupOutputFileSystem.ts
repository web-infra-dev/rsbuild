import type {
  Compiler,
  OutputFileSystem as RspackOutputFileSystem,
} from '@rspack/core';
import type { Options, OutputFileSystem } from '../index';

export async function setupOutputFileSystem(
  options: Options,
  compilers: Compiler[],
): Promise<OutputFileSystem> {
  let outputFileSystem: unknown;

  if (options.writeToDisk !== true) {
    const { createFsFromVolume, Volume } = await import(
      '../../../compiled/memfs/index.js'
    );
    outputFileSystem = createFsFromVolume(new Volume());
  } else {
    ({ outputFileSystem } = compilers[0]);
  }

  for (const compiler of compilers) {
    compiler.outputFileSystem = outputFileSystem as RspackOutputFileSystem;
  }

  return outputFileSystem as OutputFileSystem;
}
