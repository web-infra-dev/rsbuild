import fs from 'node:fs';
import type { Compiler, OutputFileSystem } from '@rspack/core';
import { requireCompiledPackage } from '../../helpers/vendors';
import type { ResolvedWriteToDisk } from './setupWriteToDisk';

export function setupOutputFileSystem(
  writeToDisk: ResolvedWriteToDisk,
  compilers: Compiler[],
): OutputFileSystem {
  if (writeToDisk !== true) {
    const { createFsFromVolume, Volume } = requireCompiledPackage('memfs');
    const outputFileSystem = createFsFromVolume(
      new Volume(),
    ) as OutputFileSystem;

    for (const compiler of compilers) {
      compiler.outputFileSystem = outputFileSystem;
    }
  }

  const compiler = compilers.find((compiler) =>
    Boolean(compiler.outputFileSystem),
  );
  return compiler?.outputFileSystem ?? fs;
}
