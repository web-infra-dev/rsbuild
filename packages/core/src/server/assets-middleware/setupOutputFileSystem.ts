import fs from 'node:fs';
import type { Compiler, OutputFileSystem } from '@rspack/core';
import { setupMemoryFileSystemCleanup } from './setupMemoryFileSystemCleanup';

export async function setupOutputFileSystem(
  writeAllToDisk: boolean,
  compilers: Compiler[],
): Promise<OutputFileSystem> {
  if (!writeAllToDisk) {
    const { createMemoryFileSystem } = await import(
      /* rspackChunkName: "memfs" */ './memoryFileSystem'
    );
    const outputFileSystem = createMemoryFileSystem();

    for (const compiler of compilers) {
      compiler.outputFileSystem = outputFileSystem as OutputFileSystem;
    }
    setupMemoryFileSystemCleanup(outputFileSystem, compilers);
  }

  const compiler = compilers.find((compiler) =>
    Boolean(compiler.outputFileSystem),
  );
  return compiler?.outputFileSystem ?? fs;
}
