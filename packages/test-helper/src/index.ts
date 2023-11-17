import { Compiler, Configuration, rspack, Stats } from '@rspack/core';
import { createFsFromVolume, Volume } from 'memfs';
import path from 'path';
import { isPathString, normalizeToPosixPath } from './path';
import {
  applyMatcherReplacement,
  createDefaultPathMatchers,
  PathMatcher,
} from './pathSerializer';

function promisifyCompilerRun<
  T extends Compiler,
  P = ReturnType<Stats['toJson']>,
>(compiler: T): Promise<P> {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        // @ts-ignore
        reject(err);
      }

      if (!stats) {
        reject('Stats 文件为空，请检查构建配置');
        return;
      }

      if (stats.hasErrors()) {
        reject(stats.toJson().errors);
      }

      resolve(stats.toJson() as P);
    });
  });
}

export interface SnapshotSerializerOptions {
  cwd?: string;
  workspace?: string;
  replace?: PathMatcher[];
}

export function createSnapshotSerializer(options?: SnapshotSerializerOptions) {
  const {
    cwd = process.cwd(),
    workspace = process.cwd(),
    replace: customMatchers = [],
  } = options || {};

  const pathMatchers: PathMatcher[] = [
    { mark: 'root', match: cwd },
    { mark: 'workspace', match: workspace },
    ...customMatchers,
    ...createDefaultPathMatchers(workspace),
  ];

  pathMatchers
    .filter((matcher) => typeof matcher.match === 'string')
    .forEach(
      (matcher) =>
        (matcher.match = normalizeToPosixPath(matcher.match as string)),
    );

  return {
    pathMatchers,
    // match path-format string
    test: (val: unknown) => typeof val === 'string' && isPathString(val),
    print: (val: unknown) => {
      const normalized = normalizeToPosixPath(val as string);
      const replaced = applyMatcherReplacement(
        pathMatchers,
        normalized,
      ).replace(/"/g, '\\"');
      return `"${replaced}"`;
    },
  };
}

export function compileByRspack(
  absPath: Configuration['entry'],
  options: Configuration = {},
) {
  const compiler = rspack({
    entry: absPath,
    mode: 'none',
    output: {
      path: path.resolve(__dirname),
      filename: 'bundle.js',
    },
    stats: 'normal',
    cache: false,
    ...options,
    optimization: {
      minimize: false,
      // concatenateModules: true,
      ...options.optimization,
    },
  });

  // @ts-ignore
  compiler.outputFileSystem = createFsFromVolume(new Volume());

  return promisifyCompilerRun(compiler);
}

export * from './doctor-kits';
export * from './rsbuild';
