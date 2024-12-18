import { join } from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';

export const myPlugin: RsbuildPlugin = {
  name: 'my-plugin',
  setup(api) {
    api.transform({ test: /\.css$/ }, async ({ code, importModule }) => {
      // @ts-expect-error TODO: Rspack type issue
      const { foo } = await importModule(join(__dirname, './src/foo.ts'));
      return code.replace('red', foo);
    });
  },
};
