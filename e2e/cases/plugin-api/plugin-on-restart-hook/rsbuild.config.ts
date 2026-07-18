import { defineConfig, type RestartContext } from '@rsbuild/core';

export default defineConfig({
  dev: {
    watchFiles: {
      paths: './test-temp-watch.txt',
      type: 'restart',
    },
  },
  plugins: [
    {
      name: 'test-on-restart',
      setup(api) {
        api.onRestart(async ({ action, filePath }: RestartContext) => {
          await Promise.resolve();
          api.logger.info(`onRestart hook called: ${action}, ${filePath}`);
        });
      },
    },
  ],
});
