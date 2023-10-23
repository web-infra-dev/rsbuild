import jiti from 'jiti';
import { join } from 'path';
import { findExists } from '@modern-js/utils';
import type {
  RsbuildEntry,
  RsbuildPlugin,
  RsbuildProvider,
  SharedRsbuildConfig,
} from '@rsbuild/shared';
import { fs } from '@rsbuild/shared/fs-extra';
import type { RsbuildConfig as RspackRsbuildConfig } from '../rspack-provider';

export type RsbuildConfig<Config> = Config & {
  source?: {
    entries?: RsbuildEntry;
  };
  plugins?: RsbuildPlugin[];
  provider?: ({ rsbuildConfig }: { rsbuildConfig: Config }) => RsbuildProvider;
};

export const defineConfig = <
  T extends SharedRsbuildConfig = RspackRsbuildConfig,
>(
  config: RsbuildConfig<T>,
) => config;

const resolveConfigPath = () => {
  const CONFIG_FILES = [
    'rsbuild.config.ts',
    'rsbuild.config.js',
    'rsbuild.config.mjs',
    'rsbuild.config.cjs',
    'rsbuild.config.mts',
    'rsbuild.config.cts',
  ];

  const root = process.cwd();

  for (const file of CONFIG_FILES) {
    const configFile = join(root, file);

    if (fs.existsSync(configFile)) {
      return configFile;
    }
  }

  return null;
};

export async function loadConfig(): Promise<ReturnType<typeof defineConfig>> {
  const configFile = resolveConfigPath();

  if (configFile) {
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
