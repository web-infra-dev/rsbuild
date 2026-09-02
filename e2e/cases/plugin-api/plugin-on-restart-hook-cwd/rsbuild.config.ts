import {
  defineConfig,
  type RestartContext,
  type RsbuildPluginAPI,
} from '@rsbuild/core';

export default defineConfig({
  dev: {
    watchFiles: {
      paths: './plugin-on-restart-hook-cwd/test-temp-watch.txt',
      type: 'restart',
      options: {
        cwd: '..',
      },
    },
  },
  plugins: [
    {
      name: 'test-on-restart',
      setup(api: RsbuildPluginAPI) {
        api.onRestart(async ({ action, filePath }: RestartContext) => {
          await Promise.resolve();
          api.logger.info(`onRestart hook called: ${action}, ${filePath}`);
        });
      },
    },
  ],
});
