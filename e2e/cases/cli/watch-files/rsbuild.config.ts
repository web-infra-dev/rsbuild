import path from 'node:path';
import { type RsbuildPlugin, defineConfig } from '@rsbuild/core';
import fse from 'fs-extra';
import content from './test-temp-config';

const testPlugin: RsbuildPlugin = {
  name: 'test-plugin',
  setup(api) {
    api.onBeforeBuild(() => {
      fse.outputFileSync(
        path.join(api.context.distPath, 'temp.txt'),
        JSON.stringify(content),
      );
    });
  },
};

export default defineConfig({
  dev: {
    writeToDisk: true,
    watchFiles: {
      type: process.env.WATCH_FILES_TYPE as 'reload-page' | 'reload-server',
      paths: ['./test-temp-config.ts'],
    },
  },
  plugins: [testPlugin],
  server: {
    port: Number(process.env.PORT),
  },
});
