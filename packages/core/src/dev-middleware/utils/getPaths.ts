import type { MultiStats as WMultiStats, Stats as WStats } from '@rspack/core';
import type { FilledContext } from '../index';

type PublicPathInfo = { outputPath: string; publicPath: string | undefined };

export function getPaths(context: FilledContext): PublicPathInfo[] {
  const { stats, options } = context;
  const childStats: WStats[] = (stats as WMultiStats).stats
    ? (stats as WMultiStats).stats
    : [stats as WStats];
  const publicPaths: PublicPathInfo[] = [];

  for (const { compilation } of childStats) {
    const outputPath = compilation.getPath(
      compilation.outputOptions.path || '',
    );
    const publicPath = options.publicPath
      ? compilation.getPath(options.publicPath as string)
      : compilation.outputOptions.publicPath
        ? compilation.getPath(compilation.outputOptions.publicPath as string)
        : '';

    publicPaths.push({ outputPath, publicPath });
  }

  return publicPaths;
}
