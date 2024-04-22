import { defineConfig, logger } from '@rsbuild/core';

const defaultReady = logger.ready;

logger.override({
  ready: (message) => {
    console.log(`[READY] ${message}`);
  },
});

export default defineConfig({
  plugins: [
    {
      name: 'restore-logger',
      setup(api) {
        api.onAfterBuild(() => {
          logger.ready = defaultReady;
        });
      },
    },
  ],
});
