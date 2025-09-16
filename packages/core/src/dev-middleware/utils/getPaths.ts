import type { MultiStats, Stats } from '@rspack/core';
import type { FilledContext } from '../index';

type PublicPathInfo = { outputPath: string; publicPath: string | undefined };

export function getPaths(context: FilledContext): PublicPathInfo[] {
  const { stats, options } = context;
  const childStats: Stats[] = (stats as MultiStats).stats
    ? (stats as MultiStats).stats
    : [stats as Stats];
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
