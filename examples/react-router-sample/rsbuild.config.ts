import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginReactRouter } from '@rsbuild/plugin-react-router';

export default defineConfig(() => {
  return {
    plugins: [
      pluginReactRouter({
        ssr: true,
        buildDirectory: 'build',
        appDirectory: 'app',
        basename: '/',
      }),
      pluginReact(),
    ],
  };
});
