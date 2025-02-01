import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginReactRouter } from '@rsbuild/plugin-react-router';

export default defineConfig(() => {
  return {
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react-router',
        'react-router/dom',
        '@react-router/node',
      ],
    },
    plugins: [pluginReactRouter(), pluginReact()],
  };
});
