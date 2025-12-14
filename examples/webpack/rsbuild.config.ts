import { defineConfig } from '@rsbuild/core';
import { webpackProvider } from '../../packages/webpack/dist';

export default defineConfig({
  provider: webpackProvider,
});
