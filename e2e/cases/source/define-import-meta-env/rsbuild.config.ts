import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  source: {
    define: {
      'import.meta.env.CUSTOM': JSON.stringify('custom'),
      'import.meta.env.COUNT': '1 + 2',
      'import.meta.env.CONFIG': { enabled: true },
      'import.meta.env.MODE': JSON.stringify('custom-mode'),
    },
  },
});
