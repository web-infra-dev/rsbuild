import fs from 'node:fs';
import type { Compiler, OutputFileSystem } from '@rspack/core';

/**
 * When every environment writes all of its files to disk, compilers keep
 * their current output file system, which is the native fs unless the user
 * set a custom one. Otherwise, all compilers share one memory fs, and
 * `setupWriteToDisk` copies the selected files to disk.
 */
export async function setupOutputFileSystem(
  writeAllToDisk: boolean,
  compilers: Compiler[],
): Promise<OutputFileSystem> {
  if (!writeAllToDisk) {
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
