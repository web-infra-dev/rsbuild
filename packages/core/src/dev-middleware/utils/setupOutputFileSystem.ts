import type {
  Compiler,
  OutputFileSystem as RspackOutputFileSystem,
} from '@rspack/core';
import type { Options, OutputFileSystem } from '../index';

export async function setupOutputFileSystem(
  options: Options,
  compilers: Compiler[],
): Promise<OutputFileSystem> {
  if (options.writeToDisk !== true) {
    const { createFsFromVolume, Volume } = await import(
      '../../../compiled/memfs/index.js'
    );
    const outputFileSystem = createFsFromVolume(new Volume());

    for (const compiler of compilers) {
      compiler.outputFileSystem = outputFileSystem as RspackOutputFileSystem;
    }
  }

  return compilers[0].outputFileSystem as OutputFileSystem;
}
