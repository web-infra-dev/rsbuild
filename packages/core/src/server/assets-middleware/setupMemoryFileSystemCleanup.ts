import { join } from 'node:path';
import type { Compiler } from '@rspack/core';
import type { IFs } from 'memfs';
import { getAssetNames } from '../../helpers/compilation';

export function setupMemoryFileSystemCleanup(
  fileSystem: IFs,
  compilers: Compiler[],
): void {
  // Leave explicit Rspack clean policies (including `keep`) in control of
  // the shared filesystem.
  if (compilers.some((compiler) => compiler.options.output.clean)) {
    return;
  }

  // Environments can share an output directory and asset filenames.
  const lastSeenByCompiler = compilers.map(() => new Map<string, number>());

  for (const [index, compiler] of compilers.entries()) {
    const lastSeen = lastSeenByCompiler[index];
    let generation = 0;
    let lastHash: string | null | undefined;

    compiler.hooks.afterEmit.tap(
      'rsbuild:clean-memory-filesystem',
      (compilation) => {
        if (compilation.errors.length) {
          return;
        }

        // No-op compilations must not expire the client's HMR update chain.
        if (compilation.hash !== lastHash) {
          generation++;
          lastHash = compilation.hash;
        }

        const outputPath = compilation.getPath(compiler.outputPath);
        // Include unchanged assets that Rspack skipped writing.
        for (const name of getAssetNames(compilation)) {
          const queryIndex = name.indexOf('?');
          const filename = queryIndex === -1 ? name : name.slice(0, queryIndex);
          const filePath = join(outputPath, filename);
          lastSeen.set(filePath, generation);
        }

        for (const [filePath, seen] of lastSeen) {
          // Keep two generations so clients can finish an update while the next
          // compilation emits. This also bounds obsolete chunks and source maps.
          if (seen >= generation - 1) {
            continue;
          }

          lastSeen.delete(filePath);
          if (lastSeenByCompiler.some((assets) => assets.has(filePath))) {
            continue;
          }

          try {
            fileSystem.unlinkSync(filePath);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
              throw error;
            }
          }
        }
      },
    );
  }
}
