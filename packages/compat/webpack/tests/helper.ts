import { join } from 'path';
import { webpackProvider } from '../src/provider';
import type { RsbuildPlugin, CreateRsbuildOptions } from '@rsbuild/shared';
import { createStubRsbuild as createBaseRsbuild } from '@rsbuild/test-helper';

export const fixturesDir = join(__dirname, 'fixtures');

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
