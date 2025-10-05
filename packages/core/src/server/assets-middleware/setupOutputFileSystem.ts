import type {
  Compiler,
  OutputFileSystem as RspackOutputFileSystem,
} from '@rspack/core';
import { requireCompiledPackage } from '../../helpers';
import type { OutputFileSystem } from './index';
import type { ResolvedWriteToDisk } from './setupWriteToDisk';

export function setupOutputFileSystem(
  writeToDisk: ResolvedWriteToDisk,
  compilers: Compiler[],
): OutputFileSystem {
  if (writeToDisk !== true) {
    const { createFsFromVolume, Volume } = requireCompiledPackage('memfs');
    const outputFileSystem = createFsFromVolume(new Volume());

    for (const compiler of compilers) {
      compiler.outputFileSystem = outputFileSystem as RspackOutputFileSystem;
    }
  }

  return compilers[0].outputFileSystem as OutputFileSystem;
}
