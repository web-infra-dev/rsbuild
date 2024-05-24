import type { CreateRsbuildOptions, RsbuildPlugin } from '@rsbuild/core';
import { createStubRsbuild as createBaseRsbuild } from '@scripts/test-helper';
import { webpackProvider } from '../src/provider';

export async function createStubRsbuild({
  rsbuildConfig = {},
  plugins,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugin[];
}) {
  rsbuildConfig.provider = webpackProvider;
  return createBaseRsbuild({
    rsbuildConfig,
    plugins,
    ...options,
  });
}
