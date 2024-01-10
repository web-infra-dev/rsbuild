import { webpackProvider } from '../src/provider';
import type { RsbuildPlugin, CreateRsbuildOptions } from '@rsbuild/shared';
import { createStubRsbuild as createBaseRsbuild } from '@scripts/test-helper';

export async function createStubRsbuild({
  rsbuildConfig = {},
  plugins,
  ...options
}: CreateRsbuildOptions & {
  plugins?: RsbuildPlugin[];
}) {
  rsbuildConfig.provider = webpackProvider;

  const rsbuild = await createBaseRsbuild({
    rsbuildConfig,
    plugins,
    ...options,
  });

  return rsbuild;
}
