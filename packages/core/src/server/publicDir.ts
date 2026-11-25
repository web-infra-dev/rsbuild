import fs from 'node:fs';
import type { FSWatcher } from 'chokidar';
import path from 'node:path';
import { isDeno } from '../constants';
import { shouldCopyPublicDir } from '../defaultConfig';
import { color } from '../helpers';
import { getChokidar, getTinyglobby } from '../helpers/cachedImport';
import { getAssetNames } from '../helpers/compilation';
import { dedupeNestedPaths, relativeWithin } from '../helpers/path';
import type { Logger } from '../logger';
import type { EnvironmentContext, Rspack } from '../types';

type PublicDirCopy = {
  publicDir: string;
  distPaths: string[];
  ignore: string[];
};

export function getPublicDirCopies(
  environments: Record<string, EnvironmentContext>,
  isWatch: boolean,
): PublicDirCopy[] {
  // Group environments with the same copy settings to preserve nested output deduplication.
  const groups = new Map<string, EnvironmentContext[]>();
  for (const environment of Object.values(environments)) {
    const key = JSON.stringify(
      environment.config.server.publicDir.map(
        ({ name, copyOnBuild, ignore }) => [name, copyOnBuild, ignore],
      ),
    );
    const group = groups.get(key);
    if (group) {
      group.push(environment);
    } else {
      groups.set(key, [environment]);
    }
  }

  const copies: PublicDirCopy[] = [];
  for (const group of groups.values()) {
    for (const { name: publicDir, copyOnBuild, ignore } of group[0].config
      .server.publicDir) {
      if (copyOnBuild === false || (!isWatch && !fs.existsSync(publicDir))) {
        continue;
      }
      const distPaths = dedupeNestedPaths(
        group
          .filter(({ config }) =>
            shouldCopyPublicDir(copyOnBuild, config.output.target),
          )
          .map(({ distPath }) => distPath),
      );
      if (distPaths.length) {
        copies.push({ publicDir: path.resolve(publicDir), distPaths, ignore });
      }
    }
  }
  return copies;
}

async function getIgnoredPaths({ publicDir, ignore }: PublicDirCopy) {
  const { glob } = await getTinyglobby();
  const paths = await glob(ignore, {
    cwd: publicDir,
    absolute: true,
    dot: true,
    onlyFiles: false,
  });
  return new Set(paths.map((p) => path.resolve(p)));
}

export async function copyPublicDir(
  copy: PublicDirCopy,
  copied?: Set<string>,
): Promise<void> {
  const { publicDir, distPaths, ignore } = copy;
  const ignored = ignore.length ? await getIgnoredPaths(copy) : undefined;
  try {
    await Promise.all(
      distPaths.map(async (distPath) => {
        // https://github.com/web-infra-dev/rsbuild/issues/5804
        if (isDeno && fs.existsSync(distPath)) {
          await fs.promises.rm(distPath, { recursive: true, force: true });
        }
        await fs.promises.cp(publicDir, distPath, {
          recursive: true,
          dereference: true,
          mode: fs.constants.COPYFILE_FICLONE,
          filter:
            ignored || copied
              ? (source, destination) => {
                  if (source !== publicDir && ignored?.has(source)) {
                    return false;
                  }
                  copied?.add(destination);
                  return true;
                }
              : undefined,
        });
      }),
    );
  } catch (err) {
    if (err instanceof Error) {
      err.message = `Failed to copy public directory '${color.yellow(publicDir)}' to output directory. To disable public directory copying, set \`${color.cyan('server.publicDir: false')}\` in your config.\n${err.message}`;
    }
    throw err;
  }
}

type PublicDirWatcher = {
  copied: Set<string>;
  ready: Promise<FSWatcher>;
  pause(): Promise<void>;
  resume(stats: Rspack.Stats | Rspack.MultiStats): Promise<void>;
  close(): Promise<void>;
};

export function watchPublicDirs(
  copies: PublicDirCopy[],
  logger: Logger,
): PublicDirWatcher {
  const copied = new Set<string>();
  const pending = new Set<string>();
  const sources = copies.toReversed();
  let generated = new Set<string>();
  let paused = true;
  let syncing = Promise.resolve();

  async function sync(output: string) {
    if (generated.has(output)) {
      return;
    }
    // A later public directory wins, just as it does on the initial copy.
    for (const copy of sources) {
      for (const distPath of copy.distPaths) {
        const relative = relativeWithin(distPath, output);
        if (!relative) {
          continue;
        }
        const source = path.join(copy.publicDir, relative);
        if (!fs.statSync(source, { throwIfNoEntry: false })?.isFile()) {
          continue;
        }
        if (copy.ignore.length) {
          const ignored = await getIgnoredPaths(copy);
          let current = source;
          while (current !== copy.publicDir && !ignored.has(current)) {
            current = path.dirname(current);
          }
          if (current !== copy.publicDir) {
            continue;
          }
        }
        await fs.promises.cp(source, output, {
          dereference: true,
          mode: fs.constants.COPYFILE_FICLONE,
        });
        copied.add(output);
        return;
      }
    }
    if (copied.has(output)) {
      await fs.promises.rm(output, { force: true });
      copied.delete(output);
    }
  }

  const flush = () => {
    if (!paused && pending.size) {
      syncing = syncing.then(async () => {
        for (const output of pending) {
          if (paused) {
            break;
          }
          pending.delete(output);
          try {
            await sync(output);
          } catch (error) {
            logger.error(error);
          }
        }
      });
    }
    return syncing;
  };

  const ready = getChokidar().then(({ default: chokidar }) => {
    const directories = new Set(copies.map((copy) => copy.publicDir));
    const watcher = chokidar.watch([...directories], {
      ignoreInitial: true,
      ignorePermissionErrors: true,
    });
    watcher.on('error', (error) => logger.error('File watcher error:', error));
    watcher.on('all', (event, file) => {
      if (event !== 'add' && event !== 'change' && event !== 'unlink') {
        return;
      }
      for (const { publicDir, distPaths } of copies) {
        const relative = relativeWithin(publicDir, file);
        if (relative) {
          for (const distPath of distPaths) {
            pending.add(path.join(distPath, relative));
          }
        }
      }
      void flush();
    });
    // Observe changes before the initial copy so edits during compilation can be replayed.
    return new Promise<FSWatcher>((resolve) =>
      watcher.once('ready', () => resolve(watcher)),
    );
  });
  return {
    copied,
    ready,
    pause() {
      paused = true;
      return syncing;
    },
    resume(stats: Rspack.Stats | Rspack.MultiStats) {
      // Failed builds can leave the previous compiler outputs on disk.
      const next = stats.hasErrors() ? new Set(generated) : new Set<string>();
      for (const { compilation } of 'stats' in stats ? stats.stats : [stats]) {
        const base = compilation.getPath(compilation.compiler.outputPath);
        for (const name of getAssetNames(compilation)) {
          const output = path.join(base, name.split('?', 1)[0]);
          next.add(output);
          copied.delete(output);
        }
      }
      // A removed compiler asset can expose a previously shadowed public file.
      for (const output of generated) {
        if (!next.has(output)) {
          pending.add(output);
        }
      }
      generated = next;
      paused = false;
      return flush();
    },
    async close() {
      paused = true;
      pending.clear();
      await Promise.all([(await ready).close(), syncing]);
    },
  };
}
