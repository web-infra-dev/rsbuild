export const RspackLoaderInternalPropertyName = '__l__';

export enum RspackSummaryCostsDataName {
  Bootstrap = 'bootstrap->rspack:beforeCompile',
  Compile = 'rspack:beforeCompile->afterCompile',
  Done = 'rspack:afterCompile->done',
  Minify = 'rspack:minify(rspack:optimizeChunkAssets)',
}
