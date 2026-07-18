import { defineConfig, type RestartContext } from '@rsbuild/core';

export default defineConfig({
  dev: {
    watchFiles: {
      paths: './plugin-on-restart-hook/test-temp-watch.txt',
      type: 'restart',
      options: {
        cwd: '..',
      },
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
