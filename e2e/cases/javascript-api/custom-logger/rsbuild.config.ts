import { logger, defineConfig } from '@rsbuild/core';

logger.override({
  log: (message) => {
    console.log(`[LOG] ${message}`);
  },
  start: (message) => {
    console.log(`[START] ${message}`);
  },
  ready: (message) => {
    console.log(`[READY] ${message}`);
  },
  error: (message) => {
    console.log(`[ERROR] ${message}`);
  },
});

export default defineConfig({});
