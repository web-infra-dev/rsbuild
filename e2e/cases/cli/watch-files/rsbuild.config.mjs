import path from 'node:path';
import { defineConfig } from '@rsbuild/core';
import fse from 'fs-extra';
import content from './test-temp-config.mjs';

const testPlugin = {
  name: 'test-plugin',
  setup(api) {
    api.onBeforeCreateCompiler(() => {
      fse.outputFileSync(
        path.join(import.meta.dirname, 'test-temp-file.txt'),
        JSON.stringify(content),
      );
    });
  },
};

export default defineConfig({
  dev: {
    writeToDisk: true,
    watchFiles: {
      type: process.env.WATCH_FILES_TYPE,
      paths: ['./test-temp-config.mjs'],
    },
  },
  plugins: [testPlugin],
  server: {
    port: Number(process.env.PORT),
  },
});
