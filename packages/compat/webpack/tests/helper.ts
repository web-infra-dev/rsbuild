import type { CreateRsbuildOptions, RsbuildPlugin } from '@rsbuild/shared';
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

  const rsbuild = await createBaseRsbuild({
    rsbuildConfig,
    plugins,
    ...options,
  });

  return rsbuild;
}
