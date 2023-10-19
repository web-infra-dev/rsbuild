import jiti from 'jiti';
import { join } from 'path';
import { findExists } from '@modern-js/utils';
import { fs } from '@rsbuild/shared/fs-extra';
import type { BuilderEntry, BuilderPlugin } from '@rsbuild/shared';
// TODO webpack config type
// import type { BuilderConfig as WebpackBuilderConfig } from '@rsbuild/webpack';
import type { BuilderConfig as RspackBuilderConfig } from '../rspack-provider';

export type BuilderConfig<Bundler extends 'rspack' | 'webpack' = 'webpack'> =
  (Bundler extends 'webpack' ? RspackBuilderConfig : RspackBuilderConfig) & {
    source?: {
      entries?: BuilderEntry;
    };
    builderPlugins?: BuilderPlugin[];
  };

export const defineConfig = <Bundler extends 'rspack' | 'webpack' = 'webpack'>(
  config: BuilderConfig<Bundler>,
) => config;

export async function loadConfig(): Promise<BuilderConfig> {
  const configFile = join(process.cwd(), 'rsbuild.config.ts');

  if (fs.existsSync(configFile)) {
    const loadConfig = jiti(__filename, {
      esmResolve: true,
      interopDefault: true,
    });
    return loadConfig(configFile);
  }

  return {};
}

export function getDefaultEntries() {
  const cwd = process.cwd();
  const files = ['ts', 'tsx', 'js', 'jsx'].map((ext) =>
    join(cwd, `src/index.${ext}`),
  );

  const entryFile = findExists(files);

  if (entryFile) {
    return {
      index: entryFile,
    };
  }

  throw new Error(
    'Could not find the entry file, please make sure that `src/index.(js|ts|tsx|jsx)` exists, or customize entry through the `source.entries` configuration.',
  );
}
