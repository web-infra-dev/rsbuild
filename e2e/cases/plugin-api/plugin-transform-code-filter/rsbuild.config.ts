import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';

export default defineConfig({
  plugins: [
    {
      name: 'generate-marker',
      setup(api) {
        api.transform({ test: /\.js$/, order: 'pre' }, ({ code }) =>
          code.replace('__SOURCE__', '__MARKER__'),
        );
      },
    } satisfies RsbuildPlugin,
  ],
});
