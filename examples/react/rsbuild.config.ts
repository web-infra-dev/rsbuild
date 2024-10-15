import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const { publicVars } = loadEnv({ prefixes: ['REACT_APP_'] });

console.log(publicVars);

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: {
      'process.env': {
        REACT_APP_PUBLIC_URL: '"https://example.com"',
        REACT_APP_API_URL: '"https://api.example.com"',
      },
    },
  },
});
