import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  dev: { lazyCompilation: false },
  output: { sourceMap: { js: 'source-map' } },
  tools: {
    rspack: {
      output: {
        hotUpdateChunkFilename: 'updates/[id].[fullhash].js',
        hotUpdateMainFilename: 'updates/[runtime].[fullhash].json',
      },
    },
  },
});
