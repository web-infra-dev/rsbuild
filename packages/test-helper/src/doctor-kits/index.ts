import { createFsFromVolume, Volume } from 'memfs';
import path from 'path';
import webpack from 'webpack';

export function compileByWebpack5(
  absPath: webpack.Configuration['entry'],
  options: webpack.Configuration = {},
) {
  const compiler = webpack({
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
  T extends webpack.Compiler,
  P = webpack.StatsCompilation,
>(compiler: T): Promise<P> {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      }

      if (!stats) {
        reject(
          'The Stats file is empty, please check the build configuration.',
        );
        return;
      }

      if (stats.hasErrors()) {
        reject(stats.toJson().errors);
      }

      resolve(stats.toJson() as P);
    });
  });
}
