import fs from 'node:fs';
import type { Compiler, OutputFileSystem } from '@rspack/core';
import type { ResolvedWriteToDisk } from './setupWriteToDisk';

export async function setupOutputFileSystem(
  writeToDisk: ResolvedWriteToDisk,
  compilers: Compiler[],
): Promise<OutputFileSystem> {
  if (writeToDisk !== true) {
    const { createMemoryFileSystem } = await import(
      /* rspackChunkName: "memfs" */ './memoryFileSystem'
    );
    const outputFileSystem = createMemoryFileSystem() as OutputFileSystem;

    for (const compiler of compilers) {
      compiler.outputFileSystem = outputFileSystem;
    }
  }

  const compiler = compilers.find((compiler) =>
    Boolean(compiler.outputFileSystem),
  );
  return compiler?.outputFileSystem ?? fs;
}
