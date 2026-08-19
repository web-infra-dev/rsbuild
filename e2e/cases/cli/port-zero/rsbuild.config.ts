import { defineConfig, type RsbuildPlugin } from '@rsbuild/core';

const plugin: RsbuildPlugin = {
  name: 'test-cli-port-zero',
  setup(api) {
    api.modifyRsbuildConfig((config) => {
      if (
        process.env.TEST_CLI_PORT_ZERO === 'true' &&
        config.server?.port !== 0
      ) {
        throw new Error('Expected CLI to preserve port 0.');
      }
    });
  },
};

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [plugin],
});
