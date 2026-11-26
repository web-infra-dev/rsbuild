import { join } from 'node:path';
import type { Compiler } from '@rspack/core';
import type { IFs } from 'memfs';
import { getAssetNames } from '../../helpers/compilation';

const ASSET_GRACE_PERIOD_MS = 30_000;

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
    const expiresAt = new Map<number, number>();
    let generation = 0;
    let lastHash: string | null | undefined;

    compiler.hooks.afterEmit.tap(
      'rsbuild:clean-memory-filesystem',
      (compilation) => {
        if (compilation.errors.length) {
          return;
        }

        const now = performance.now();
        if (compilation.hash !== lastHash) {
          // Start the grace period when a newer build replaces this generation.
          if (generation > 0) {
            expiresAt.set(generation, now + ASSET_GRACE_PERIOD_MS);
          }
          generation++;
          lastHash = compilation.hash;
        }

        // Expirations are ordered. Prune on emit so idle servers need no timer.
        for (const [retiredGeneration, deadline] of expiresAt) {
          if (deadline > now) {
            break;
          }
          expiresAt.delete(retiredGeneration);
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
          // Always keep two generations. During rapid rebuilds, keep older
          // updates long enough for clients to fetch the rest of the chain.
          if (seen >= generation - 1 || expiresAt.has(seen)) {
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
