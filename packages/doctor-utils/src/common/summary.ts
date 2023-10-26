export enum SummaryCostsDataName {
  Bootstrap = 'bootstrap->beforeCompile',
  Compile = 'beforeCompile->afterCompile',
  Done = 'afterCompile->done',
  Minify = 'minify(webpack4:optimizeChunkAssets|webpack5:processAssets|rspack:processAssets)',
}
