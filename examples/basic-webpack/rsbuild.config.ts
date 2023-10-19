import { defineConfig } from '@rsbuild/core';
import { builderWebpackProvider } from '@rsbuild/webpack';

export default defineConfig({
  provider: builderWebpackProvider,
});
