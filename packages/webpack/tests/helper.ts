import type { CreateRsbuildOptions, RsbuildPlugins } from '@rsbuild/core';
import { createStubRsbuild as createBaseRsbuild } from '@scripts/test-helper';
import { webpackProvider } from '../src/provider';

export async function createStubRsbuild({
  config = {},
  plugins,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugins;
}) {
  config.provider = webpackProvider;
  return createBaseRsbuild({
    config,
    plugins,
    ...options,
  });
}
