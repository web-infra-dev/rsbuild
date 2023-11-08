import { ModuleGraph } from '@rsbuild/doctor-sdk/graph';
import path, { relative } from 'path';
import Webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import * as Webpack4 from 'webpack4';

export function removeAbsModulePath(graph: ModuleGraph, root: string) {
  for (const mod of graph.getModules()) {
    (mod as any).path = relative(root, mod.path);
  }
}
export function compileByWebpack5(
  absPath: Webpack.Configuration['entry'],
  options: Webpack.Configuration = {},
) {
  const compiler = Webpack({
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
      concatenateModules: true,
      ...options.optimization,
    },
  });

  compiler.outputFileSystem = createFsFromVolume(new Volume());
  compiler.outputFileSystem.join = path.join.bind(path);

  return promisifyCompilerRun(compiler);
}

function promisifyCompilerRun<
  T extends Webpack4.Compiler | Webpack.Compiler,
  P = T extends Webpack4.Compiler
    ? Webpack4.Stats.ToJsonOutput
    : Webpack.StatsCompilation,
>(compiler: T): Promise<P> {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
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
