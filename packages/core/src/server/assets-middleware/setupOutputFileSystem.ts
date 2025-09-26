import type {
  Compiler,
  OutputFileSystem as RspackOutputFileSystem,
} from '@rspack/core';
import type { OutputFileSystem } from './index';
import type { ResolvedWriteToDisk } from './setupWriteToDisk';

export async function setupOutputFileSystem(
  writeToDisk: ResolvedWriteToDisk,
  compilers: Compiler[],
): Promise<OutputFileSystem> {
  if (writeToDisk !== true) {
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
