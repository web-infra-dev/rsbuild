import type { CreateRsbuildOptions, RsbuildPlugins } from '@rsbuild/core';
import { createStubRsbuild as createBaseRsbuild } from '@scripts/test-helper';
import { webpackProvider } from '../src/provider';

export async function createStubRsbuild({
  rsbuildConfig = {},
  plugins,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugins;
}) {
  rsbuildConfig.provider = webpackProvider;
  return createBaseRsbuild({
    rsbuildConfig,
    plugins,
    ...options,
  });
}
