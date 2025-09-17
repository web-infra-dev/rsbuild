import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  output: {
    // @ts-expect-error intentional invalid target for testing
    target: 'foo',
  },
});
