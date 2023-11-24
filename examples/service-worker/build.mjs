import { createRsbuild } from '@rsbuild/core';

const builder = await createRsbuild({
  target: 'service-worker',
  rsbuildConfig: {
    source: {
      entry: { sw: './src/sw.ts' },
    },
    output: {
      disableSourceMap: true,
      distPath: {
        root: './dist',
        worker: './',
      },
      copy: ['./index.html'],
    },
  },
});

builder.build({ watch: Boolean(process.env.WATCH) });
