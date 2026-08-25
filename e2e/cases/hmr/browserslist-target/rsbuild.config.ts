import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  tools: {
    htmlPlugin: false,
    rspack: (config, { mergeConfig }) =>
      mergeConfig(config, {
        target: 'browserslist:last 2 chrome versions',
      }),
  },
});
